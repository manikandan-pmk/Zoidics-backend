import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import {
  LeadRepo,
  LeadCampaignRepo,
  LeadCategoryRepo,
  WhatsAppTemplateRepo,
} from "@/lib/repository";



const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 1000;
const MAX_HEADER_ROWS = 10;
const MAX_ERROR_ROWS = 100;

type LeadField =
  | "businessName"
  | "contactPerson"
  | "phone"
  | "email"
  | "instagram"
  | "serviceNeeded"
  | "city"
  | "address";

type ParsedLead = Record<LeadField, string>;
type ImportError = { row: number; sheet: string; reason: string };

const FIELD_ALIASES: Record<LeadField, string[]> = {
  businessName: [
    "business name", "business name from directory", "name of business",
    "company name", "company", "business", "clinic name", "dental clinic name",
    "shop name", "store name", "restaurant name", "hotel name", "school name",
    "hospital name", "salon name", "firm name", "organization name",
    "organisation name", "establishment name", "listing name", "place name",
    "business title", "business listing", "prospect name", "lead name", "name",
  ],
  contactPerson: [
    "contact person", "contact person name", "person name", "owner name",
    "owner", "contact name", "proprietor", "decision maker",
  ],
  phone: [
    "phone number", "mobile number", "contact number", "public phone",
    "business phone", "primary phone", "telephone number", "whatsapp number",
    "phone", "mobile", "telephone", "whatsapp",
  ],
  email: ["email address", "public email", "business email", "contact email", "email"],
  instagram: [
    "instagram profile url", "instagram profile", "instagram username",
    "instagram handle", "instagram url", "instagram link", "instagram",
  ],
  serviceNeeded: [
    "service needed", "services needed", "business category", "type of business",
    "service", "category", "industry", "requirement",
  ],
  city: ["city", "town", "district", "locality", "area name", "location"],
  address: [
    "area address from directory", "area / address from directory",
    "address from directory", "full address", "business address",
    "clinic address", "shop address", "street address", "address", "area",
  ],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findFieldIndex(headers: unknown[], field: LeadField): number {
  const normalizedHeaders = headers.map(normalizeHeader);
  const aliases = FIELD_ALIASES[field].map(normalizeHeader);

  for (const alias of aliases) {
    const index = normalizedHeaders.findIndex((header) => header === alias);
    if (index !== -1) return index;
  }

  for (const alias of aliases) {
    if (alias.length < 5) continue;
    const index = normalizedHeaders.findIndex(
      (header) => header.length >= 5 && (header.includes(alias) || alias.includes(header)),
    );
    if (index !== -1) return index;
  }
  return -1;
}

function readLeadRow(values: unknown[], indexes: Record<LeadField, number>): ParsedLead {
  const get = (field: LeadField): string => {
    const index = indexes[field];
    if (index < 0) return "";
    const value = values[index];
    return value == null ? "" : String(value).trim();
  };

  return {
    businessName: get("businessName"),
    contactPerson: get("contactPerson"),
    phone: get("phone"),
    email: get("email").toLowerCase(),
    instagram: get("instagram"),
    serviceNeeded: get("serviceNeeded"),
    city: get("city"),
    address: get("address"),
  };
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function findHeaderRow(matrix: unknown[][]) {
  let best:
    | { headerIndex: number; indexes: Record<LeadField, number>; score: number }
    | undefined;

  const fields = Object.keys(FIELD_ALIASES) as LeadField[];
  for (let headerIndex = 0; headerIndex < Math.min(matrix.length, MAX_HEADER_ROWS); headerIndex++) {
    const headers = matrix[headerIndex] ?? [];
    const indexes = Object.fromEntries(
      fields.map((field) => [field, findFieldIndex(headers, field)]),
    ) as Record<LeadField, number>;

    if (indexes.businessName < 0) continue;
    const score = fields.filter((field) => indexes[field] >= 0).length;
    if (!best || score > best.score) best = { headerIndex, indexes, score };
  }
  return best;
}

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
    const templateIdRaw = String(
      formData.get("whatsAppTemplateId") ?? formData.get("templateId") ?? "",
    ).trim();
    const rawCampaignId = String(formData.get("campaignId") ?? "").trim();
    const requestedCampaignName = String(formData.get("campaignName") ?? "").trim();

    if (!(file instanceof File)) return fail("Please upload an Excel or CSV file.", 400);

    const categoryId = Number(categoryIdRaw);
    const templateId = Number(templateIdRaw);
    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      return fail("Please select a valid business category.", 400);
    }
    if (!Number.isSafeInteger(templateId) || templateId < 1) {
      return fail("Choose and confirm a saved WhatsApp template before importing.", 400);
    }

    const hasCampaignId = rawCampaignId !== "";
    const campaignId = hasCampaignId ? Number(rawCampaignId) : null;
    if (hasCampaignId && (!Number.isSafeInteger(campaignId) || Number(campaignId) < 1)) {
      return fail("The selected campaign is invalid.", 400);
    }

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".xlsx", ".xls", ".csv"].includes(extension)) {
      return fail("Supported formats are XLSX, XLS and CSV.", 400);
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return fail("File must be between 1 byte and 5 MB.", 400);
    }

    const category = await LeadCategoryRepo.findOne({
      where: { id: categoryId, isActive: true },
    });
    if (!category) return fail("The selected business category is not active or no longer exists.", 404);

    const template = await WhatsAppTemplateRepo.findOne({
      where: { id: templateId, isActive: true },
      relations: { category: true },
    });
    if (!template || !template.category?.isActive) {
      return fail("The selected WhatsApp template is inactive or no longer exists.", 404);
    }
    if (Number(template.categoryId) !== categoryId) {
      return fail("This WhatsApp template does not match the selected business category.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer", cellText: true, cellDates: false });
    } catch {
      return fail("We could not read this spreadsheet. Please check the file and try again.", 400);
    }

    const allRows: { lead: ParsedLead; rowNumber: number; sheetName: string }[] = [];
    const skippedSheets: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        raw: false,
      });
      const detected = findHeaderRow(matrix);
      if (!detected) {
        skippedSheets.push(sheetName);
        continue;
      }

      for (let index = detected.headerIndex + 1; index < matrix.length; index++) {
        const values = matrix[index] ?? [];
        if (values.every((value) => String(value ?? "").trim() === "")) continue;

        allRows.push({
          lead: readLeadRow(values, detected.indexes),
          rowNumber: index + 1,
          sheetName,
        });
        if (allRows.length > MAX_ROWS) {
          return NextResponse.json(
            {
              success: false,
              message: `The workbook contains more than ${MAX_ROWS} data rows across its worksheets.`,
              skippedSheets,
            },
            { status: 400 },
          );
        }
      }
    }

    if (allRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No business-name column was detected. Check the first 10 rows of each worksheet.",
          skippedSheets,
        },
        { status: 400 },
      );
    }

    const campaignRepository = LeadCampaignRepo;
    let campaign: Awaited<ReturnType<typeof LeadCampaignRepo.findOneBy>> = null;

    if (hasCampaignId) {
      campaign = await campaignRepository.findOneBy({ id: Number(campaignId) });
      if (!campaign) return fail("Campaign not found.", 404);
    } else {
      const campaignName =
        requestedCampaignName.slice(0, 150) || `${category.name} Outreach`;
      campaign = await campaignRepository
        .createQueryBuilder("campaign")
        .where("LOWER(campaign.name) = LOWER(:name)", { name: campaignName })
        .getOne();
    }

    if (campaign && campaign.status !== "active") {
      return fail("Only active campaigns accept imports.", 400);
    }

    const leadRepository = LeadRepo;
    const existingLeads = campaign
      ? await leadRepository.find({
          where: { campaignId: campaign.id },
          select: { phone: true, email: true },
        })
      : [];

    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();
    for (const lead of existingLeads) {
      const phone = lead.phone ? normalizePhone(lead.phone) : "";
      const email = lead.email ? normalizeEmail(lead.email) : "";
      if (phone) seenPhones.add(phone);
      if (email) seenEmails.add(email);
    }

    type LeadRecord = NonNullable<Awaited<ReturnType<typeof LeadRepo.findOne>>>;
    const validLeads: Partial<LeadRecord>[] = [];
    const errors: ImportError[] = [];
    let duplicates = 0;

    for (const item of allRows) {
      const {
        businessName, contactPerson, phone, email, instagram,
        serviceNeeded, city, address,
      } = item.lead;
      const rowInfo = { row: item.rowNumber, sheet: item.sheetName };

      if (!businessName) {
        errors.push({ ...rowInfo, reason: "Business name is missing." });
        continue;
      }
      if (
        businessName.length > 150 ||
        contactPerson.length > 120 ||
        phone.length > 30 ||
        email.length > 180 ||
        instagram.length > 180 ||
        serviceNeeded.length > 100 ||
        city.length > 100 ||
        address.length > 1000
      ) {
        errors.push({ ...rowInfo, reason: "One or more fields exceed the maximum length." });
        continue;
      }

      const normalizedPhone = normalizePhone(phone);
      const normalizedEmail = normalizeEmail(email);
      if (
        (normalizedPhone && seenPhones.has(normalizedPhone)) ||
        (normalizedEmail && seenEmails.has(normalizedEmail))
      ) {
        duplicates++;
        continue;
      }

      if (normalizedPhone) seenPhones.add(normalizedPhone);
      if (normalizedEmail) seenEmails.add(normalizedEmail);

      const notes = [
        address ? `Address: ${address}` : "",
        city ? `City: ${city}` : "",
      ].filter(Boolean).join("\n");

      validLeads.push({
        categoryId: category.id,
        businessName,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: normalizedEmail || null,
        instagram: instagram || null,
        serviceNeeded: serviceNeeded || category.name || null,
        source: "Excel Import",
        notes: notes || null,
        status: "new",
        lastCallResult: "not_called",
        priority: "medium",
        interestLevel: "warm",
        nextFollowUpAt: null,
        lastContactedAt: null,
      });
    }

    if (validLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: "The spreadsheet was checked, but there were no new valid leads to save.",
        campaignId: campaign?.id,
        campaignName: campaign?.name,
        categoryId: category.id,
        categoryName: category.name,
        templateId: template.id,
        templateName: template.title,
        imported: 0,
        duplicates,
        failed: errors.length,
        errors: errors.slice(0, MAX_ERROR_ROWS),
        skippedSheets,
      });
    }

    let importedCampaignId = campaign?.id ?? 0;
    let importedCampaignName = campaign?.name ?? "";

    await LeadRepo.manager.transaction(async (manager) => {
      const transactionalLeads = manager.getRepository(LeadRepo.target) as typeof LeadRepo;
      const transactionalCampaigns = manager.getRepository(LeadCampaignRepo.target) as typeof LeadCampaignRepo;
      let targetCampaign = campaign;

      if (!targetCampaign) {
        const campaignName =
          requestedCampaignName.slice(0, 150) || `${category.name} Outreach`;
        targetCampaign = transactionalCampaigns.create({
          name: campaignName,
          topic: campaignName,
          status: "active",
          originalFileName: file.name,
        });
        targetCampaign = await transactionalCampaigns.save(targetCampaign);
      } else {
        targetCampaign.originalFileName = file.name;
        targetCampaign = await transactionalCampaigns.save(targetCampaign);
      }

      importedCampaignId = targetCampaign.id;
      importedCampaignName = targetCampaign.name;

      const leadsToSave = validLeads.map((lead) => ({
        ...lead,
        campaignId: targetCampaign!.id,
      }));

      for (let index = 0; index < leadsToSave.length; index += 100) {
        const batch = leadsToSave.slice(index, index + 100);
        await transactionalLeads.save(transactionalLeads.create(batch));
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead import completed successfully.",
        campaignId: importedCampaignId,
        campaignName: importedCampaignName,
        categoryId: category.id,
        categoryName: category.name,
        templateId: template.id,
        templateName: template.title,
        imported: validLeads.length,
        duplicates,
        failed: errors.length,
        errors: errors.slice(0, MAX_ERROR_ROWS),
        skippedSheets,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("IMPORT LEADS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to import leads. Check the server log for details." },
      { status: 500 },
    );
  }
}
