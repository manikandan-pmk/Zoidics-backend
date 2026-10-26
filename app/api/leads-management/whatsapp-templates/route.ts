import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  LeadCategoryRepo,
  WhatsAppTemplateRepo,
} from "@/lib/repository";



const COMPANY_NAME = "Zoidics Software Solutions";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

type TemplateInput = {
  categoryId: number;
  title: string;
  topic: string;
  content: string;
  language: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  imageAltText: string | null;
  isActive: boolean;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function normalizeTemplate(
  template: NonNullable<Awaited<ReturnType<typeof WhatsAppTemplateRepo.findOne>>>,
) {
  return {
    ...template,
    name: template.title,
    message: template.content,
    categoryName: template.category?.name ?? null,
  };
}

async function readInput(request: NextRequest): Promise<{
  input: TemplateInput;
  imageFile: File | null;
}> {
  const contentType = request.headers.get("content-type") || "";
  let raw: Record<string, unknown>;
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const candidate = form.get("image");
    if (candidate instanceof File && candidate.size > 0) imageFile = candidate;

    raw = {
      categoryId: form.get("categoryId"),
      title: form.get("title") ?? form.get("name"),
      topic: form.get("topic"),
      content: form.get("content") ?? form.get("message"),
      language: form.get("language"),
      imageUrl: form.get("imageUrl"),
      imagePublicId: form.get("imagePublicId"),
      imageAltText: form.get("imageAltText"),
      isActive: form.get("isActive"),
    };
  } else {
    try {
      raw = await request.json();
    } catch {
      throw new Error("Request body must be valid JSON or multipart form data.");
    }
  }

  const categoryId = Number(raw.categoryId);
  const title = typeof raw.title === "string"
    ? raw.title.trim()
    : typeof raw.name === "string" ? raw.name.trim() : "";
  const content = typeof raw.content === "string"
    ? raw.content.trim()
    : typeof raw.message === "string" ? raw.message.trim() : "";
  const topic = typeof raw.topic === "string" && raw.topic.trim()
    ? raw.topic.trim()
    : title;
  const language = typeof raw.language === "string" && raw.language.trim()
    ? raw.language.trim()
    : "English";
  const imageUrl = typeof raw.imageUrl === "string" && raw.imageUrl.trim()
    ? raw.imageUrl.trim()
    : null;
  const imagePublicId = typeof raw.imagePublicId === "string" && raw.imagePublicId.trim()
    ? raw.imagePublicId.trim()
    : null;
  const imageAltText = typeof raw.imageAltText === "string" && raw.imageAltText.trim()
    ? raw.imageAltText.trim()
    : null;
  const activeValue = raw.isActive;
  const isActive = activeValue === undefined
    ? true
    : activeValue === true || activeValue === "true" || activeValue === "1";

  return {
    input: {
      categoryId,
      title,
      topic,
      content,
      language,
      imageUrl,
      imagePublicId,
      imageAltText,
      isActive,
    },
    imageFile,
  };
}

function validateInput(input: TemplateInput): string | null {
  if (!Number.isSafeInteger(input.categoryId) || input.categoryId < 1) {
    return "Choose a valid business category.";
  }
  if (!input.title || input.title.length > 150) {
    return "Template name is required and must be 150 characters or fewer.";
  }
  if (!input.topic || input.topic.length > 100) {
    return "Template topic is required and must be 100 characters or fewer.";
  }
  if (!input.content || input.content.length > 10000) {
    return "Message is required and must be 10,000 characters or fewer.";
  }
  if (input.language.length > 20) return "Language must be 20 characters or fewer.";
  if (input.imageUrl && (!/^https:\/\//i.test(input.imageUrl) || input.imageUrl.length > 500)) {
    return "Image URL must be a valid HTTPS URL.";
  }
  if (input.imagePublicId && input.imagePublicId.length > 255) {
    return "Image public ID must be 255 characters or fewer.";
  }
  if (input.imageAltText && input.imageAltText.length > 200) {
    return "Image alt text must be 200 characters or fewer.";
  }
  return null;
}

async function storeImage(file: File): Promise<{ imageUrl: string; imagePublicId: string }> {
  if (file.size <= 0) throw new Error("Selected image is empty.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Image must be 5 MB or smaller.");

  const extension = IMAGE_TYPES[file.type];
  if (!extension) throw new Error("Choose a PNG, JPG or WEBP image.");

  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "whatsapp-templates");
  await mkdir(uploadDirectory, { recursive: true });

  const fileName = `${randomUUID()}${extension}`;
  const filePath = path.join(uploadDirectory, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes, { flag: "wx" });

  return {
    imageUrl: `/uploads/whatsapp-templates/${fileName}`,
    imagePublicId: fileName,
  };
}

export async function GET(request: NextRequest) {
  try {
    const categoryParam = request.nextUrl.searchParams.get("categoryId");
    const activeOnly = request.nextUrl.searchParams.get("activeOnly") === "true";

    if (categoryParam && (!/^\d+$/.test(categoryParam) || Number(categoryParam) < 1)) {
      return jsonError("Invalid categoryId.", 400);
    }

    const query = WhatsAppTemplateRepo
      .createQueryBuilder("template")
      .leftJoinAndSelect("template.category", "category")
      .orderBy("template.updatedAt", "DESC");

    if (categoryParam) {
      query.andWhere("template.categoryId = :categoryId", { categoryId: Number(categoryParam) });
    }
    if (activeOnly) {
      query
        .andWhere("template.isActive = :active", { active: true })
        .andWhere("category.isActive = :categoryActive", { categoryActive: true });
    }

    const templates = await query.getMany();
    return NextResponse.json({ success: true, data: templates.map(normalizeTemplate) });
  } catch (error) {
    console.error(" WhatsApp templates:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load WhatsApp templates." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { input, imageFile } = await readInput(request);
    const validationError = validateInput(input);
    if (validationError) return jsonError(validationError);

    const category = await LeadCategoryRepo.findOne({
      where: { id: input.categoryId, isActive: true },
    });
    if (!category) return jsonError("Active category not found.", 404);

    let imageUrl = input.imageUrl;
    let imagePublicId = input.imagePublicId;
    if (imageFile) {
      const stored = await storeImage(imageFile);
      imageUrl = stored.imageUrl;
      imagePublicId = stored.imagePublicId;
    }

    const template = WhatsAppTemplateRepo.create({
      categoryId: category.id,
      category,
      companyName: COMPANY_NAME,
      title: input.title,
      topic: input.topic,
      language: input.language,
      content: input.content,
      imageUrl,
      imagePublicId,
      imageAltText: input.imageAltText,
      isActive: input.isActive,
    });
    const saved = await WhatsAppTemplateRepo.save(template);
    const hydrated = await WhatsAppTemplateRepo.findOne({
      where: { id: saved.id },
      relations: { category: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: "WhatsApp template saved successfully.",
        data: normalizeTemplate(hydrated ?? saved),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST WhatsApp template:", error);
    const message = error instanceof Error ? error.message : "Failed to save WhatsApp template.";
    if (/image|file|png|jpg|webp|5 MB|empty/i.test(message)) return jsonError(message, 400);
    return NextResponse.json(
      { success: false, message: "Failed to save WhatsApp template. Check server logs and database connection." },
      { status: 500 },
    );
  }
}
