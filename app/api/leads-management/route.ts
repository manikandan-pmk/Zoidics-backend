
import { NextRequest, NextResponse } from "next/server";

import {
  LeadRepo,
  LeadCampaignRepo,
  LeadCategoryRepo,
  WhatsAppTemplateRepo,
} from "@/lib/repository";


function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Legacy lead records store Address and City inside notes.
 * Extract them for the frontend without changing the database schema.
 */
type LeadRecord = NonNullable<Awaited<ReturnType<typeof LeadRepo.findOne>>>;

function formatLead(lead: LeadRecord) {
  const lines = (lead.notes ?? "").split(/\r?\n/);

  let address: string | null = null;
  let city: string | null = null;

  const remainingNotes = lines.filter((line) => {
    const addressMatch = line.match(/^Address:\s*(.*)$/i);
    const cityMatch = line.match(/^City:\s*(.*)$/i);

    if (addressMatch) {
      address = addressMatch[1].trim() || null;
      return false;
    }

    if (cityMatch) {
      city = cityMatch[1].trim() || null;
      return false;
    }

    return true;
  });

  return {
    ...lead,
    address,
    city,
    notes: remainingNotes.join("\n").trim() || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const requestedPage = Number(params.get("page") ?? 1);
    const requestedLimit = Number(params.get("limit") ?? 10);

    if (
      !Number.isSafeInteger(requestedPage) ||
      requestedPage < 1 ||
      !Number.isSafeInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid pagination parameters.",
        },
        { status: 400 },
      );
    }

    const page = requestedPage;
    const limit = Math.min(100, requestedLimit);

    const search = (params.get("search") || "").trim();
    const campaignId = params.get("campaignId");
    const status = params.get("status") || "";
    const priority = params.get("priority") || "";

    const repository = LeadRepo;

    const query = repository
      .createQueryBuilder("lead")
      .leftJoinAndSelect("lead.campaign", "campaign")
      .leftJoinAndSelect("lead.category", "category")
      .orderBy("lead.createdAt", "DESC")
      .addOrderBy("lead.id", "DESC");

    if (search) {
      query.andWhere(
        `(
          lead.businessName LIKE :search
          OR lead.phone LIKE :search
          OR lead.email LIKE :search
          OR lead.contactPerson LIKE :search
          OR lead.notes LIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    if (campaignId) {
      const parsedCampaignId = Number(campaignId);

      if (
        !Number.isSafeInteger(parsedCampaignId) ||
        parsedCampaignId < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid campaign ID.",
          },
          { status: 400 },
        );
      }

      query.andWhere("lead.campaignId = :campaignId", {
        campaignId: parsedCampaignId,
      });
    }

    const validStatuses = [
      "new",
      "contacted",
      "interested",
      "follow_up",
      "converted",
      "not_interested",
      "lost",
    ];

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid lead status.",
          },
          { status: 400 },
        );
      }

      query.andWhere("lead.status = :status", { status });
    }

    const validPriorities = ["high", "medium", "low"];

    if (priority) {
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid lead priority.",
          },
          { status: 400 },
        );
      }

      query.andWhere("lead.priority = :priority", { priority });
    }

    const [leads, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return NextResponse.json(
      {
        success: true,
        data: leads.map(formatLead),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load leads from the database.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const businessName = String(body.businessName ?? "").trim();
    const contactPerson = String(body.contactPerson ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));
    const instagram = String(body.instagram ?? "").trim();
    const serviceNeeded = String(body.serviceNeeded ?? "").trim();
    const city = String(body.city ?? "").trim();
    const address = String(body.address ?? "").trim();

    const categoryId = Number(body.categoryId);
    const templateId = Number(body.templateId);
    const campaignId = body.campaignId ? Number(body.campaignId) : null;

    if (!businessName) {
      return NextResponse.json(
        {
          success: false,
          message: "Business name is required.",
        },
        { status: 400 },
      );
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
      return NextResponse.json(
        {
          success: false,
          message: "One or more fields exceed the maximum length.",
        },
        { status: 400 },
      );
    }

    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Select a valid business category.",
        },
        { status: 400 },
      );
    }

    if (!Number.isSafeInteger(templateId) || templateId < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Select a saved WhatsApp template.",
        },
        { status: 400 },
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a phone number or email address.",
        },
        { status: 400 },
      );
    }


    const category = await LeadCategoryRepo.findOne({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected category is inactive or not found.",
        },
        { status: 404 },
      );
    }

    const template = await WhatsAppTemplateRepo.findOne({
      where: { id: templateId, isActive: true },
      relations: { category: true },
    });

    if (!template || !template.category?.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected WhatsApp template is inactive or not found.",
        },
        { status: 404 },
      );
    }

    if (Number(template.categoryId) !== categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "WhatsApp template does not match the selected category.",
        },
        { status: 400 },
      );
    }

    const result = await LeadRepo.manager.transaction(async (manager) => {
      const campaignRepository = manager.getRepository(LeadCampaignRepo.target);
      const leadRepository = manager.getRepository(LeadRepo.target);

      let campaign: NonNullable<Awaited<ReturnType<typeof LeadCampaignRepo.findOneBy>>> | null = null;

      if (campaignId !== null) {
        if (!Number.isSafeInteger(campaignId) || campaignId < 1) {
          throw new Error("INVALID_CAMPAIGN");
        }

        campaign = await campaignRepository.findOneBy({
          id: campaignId,
        });

        if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
        if (campaign.status !== "active") {
          throw new Error("CAMPAIGN_INACTIVE");
        }
      } else {
        const campaignName = `${category.name} Outreach`.slice(0, 150);

        campaign = await campaignRepository
          .createQueryBuilder("campaign")
          .where("LOWER(campaign.name) = LOWER(:name)", {
            name: campaignName,
          })
          .getOne();

        if (campaign && campaign.status !== "active") {
          throw new Error("CAMPAIGN_INACTIVE");
        }

        if (!campaign) {
          campaign = campaignRepository.create({
            name: campaignName,
            topic: category.name.slice(0, 100),
            status: "active",
            originalFileName: null,
          });

          campaign = await campaignRepository.save(campaign);
        }
      }

      const existingLeads = await leadRepository.find({
        where: { campaignId: campaign.id },
        select: { phone: true, email: true },
      });

      const normalizedPhone = normalizePhone(phone);

      const duplicate = existingLeads.some((lead) => {
        const existingPhone = lead.phone
          ? normalizePhone(lead.phone)
          : "";

        const existingEmail = lead.email
          ? normalizeEmail(lead.email)
          : "";

        return (
          (!!normalizedPhone && existingPhone === normalizedPhone) ||
          (!!email && existingEmail === email)
        );
      });

      if (duplicate) throw new Error("DUPLICATE_LEAD");

      // Preserve address/city in the legacy notes column.
      // A separate database column requires a Lead entity/schema update.
      const notes = [
        address ? `Address: ${address}` : "",
        city ? `City: ${city}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const lead = leadRepository.create({
        campaignId: campaign.id,
        categoryId: category.id,
        businessName,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        instagram: instagram || null,
        serviceNeeded: serviceNeeded || category.name,
        source: "Manual Entry",
        notes: notes || null,
        status: "new",
        lastCallResult: "not_called",
        priority: "medium",
        interestLevel: "warm",
        nextFollowUpAt: null,
        lastContactedAt: null,
      });

      const savedLead = await leadRepository.save(lead);

      return {
        lead: savedLead,
        campaignId: campaign.id,
        campaignName: campaign.name,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully.",
        data: formatLead(result.lead),
        campaignId: result.campaignId,
        campaignName: result.campaignName,
        categoryId: category.id,
        categoryName: category.name,
        templateId: template.id,
        templateName: template.title,
        sendMode: "click_to_whatsapp",
        requiresUserConfirmation: true,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      const errors: Record<string, { message: string; status: number }> = {
        INVALID_CAMPAIGN: {
          message: "Invalid campaign ID.",
          status: 400,
        },
        CAMPAIGN_NOT_FOUND: {
          message: "Campaign not found.",
          status: 404,
        },
        CAMPAIGN_INACTIVE: {
          message: "Only active campaigns accept leads.",
          status: 400,
        },
        DUPLICATE_LEAD: {
          message:
            "A lead with this phone or email already exists in this campaign.",
          status: 409,
        },
      };

      const knownError = errors[error.message];

      if (knownError) {
        return NextResponse.json(
          {
            success: false,
            message: knownError.message,
          },
          { status: knownError.status },
        );
      }
    }

    console.error("error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create lead.",
      },
      { status: 500 },
    );
  }
}
