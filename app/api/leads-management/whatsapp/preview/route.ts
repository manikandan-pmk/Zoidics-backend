import { NextRequest, NextResponse } from "next/server";
import {
  LeadRepo,
  WhatsAppTemplateRepo,
} from "@/lib/repository";



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const leadId = Number(body.leadId);
    const templateId = Number(body.templateId);

    if (
      !Number.isSafeInteger(leadId) ||
      leadId < 1 ||
      !Number.isSafeInteger(templateId) ||
      templateId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid leadId and templateId are required",
        },
        { status: 400 },
      );
    }

    const lead = await LeadRepo.findOne({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 },
      );
    }

    if (!lead.phone?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "This lead does not have a phone number",
        },
        { status: 400 },
      );
    }

    const template = await WhatsAppTemplateRepo.findOne({
      where: {
        id: templateId,
        isActive: true,
      },
      relations: {
        category: true,
      },
    });

    if (!template || !template.category?.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Active template or category not found",
        },
        { status: 404 },
      );
    }

    // The template must belong to the same category as the lead.
    // This check becomes enforceable once categoryId is stored on Lead.
    const leadWithCategory = lead as typeof lead & {
      categoryId?: number | null;
    };

    if (
      leadWithCategory.categoryId != null &&
      leadWithCategory.categoryId !== template.categoryId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This template does not match the lead category",
        },
        { status: 400 },
      );
    }

    const replacements: Record<string, string> = {
      businessName: lead.businessName || "",
      contactPerson: lead.contactPerson || "",
      serviceNeeded: lead.serviceNeeded || template.topic,
      companyName: "Zoidics Software Solutions",
    };

    const renderedContent = template.content.replace(
      /\{\{\s*(businessName|contactPerson|serviceNeeded|companyName)\s*\}\}/g,
      (_match: string, key: string): string => replacements[key] ?? "",
    );

    const phoneDigits = lead.phone.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number is invalid. Verify the country code before proceeding.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp preview prepared",
      data: {
        leadId: lead.id,
        businessName: lead.businessName,
        contactPerson: lead.contactPerson,
        phone: phoneDigits,
        templateId: template.id,
        categoryId: template.categoryId,
        companyName: "Zoidics Software Solutions",
        message: renderedContent,
        imageUrl: template.imageUrl,
        imageAltText: template.imageAltText,
        sendMode: "click_to_whatsapp",
        requiresUserConfirmation: true,
      },
    });
  } catch (error) {
    console.error("WhatsApp preview error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to prepare WhatsApp preview",
      },
      { status: 500 },
    );
  }
}
