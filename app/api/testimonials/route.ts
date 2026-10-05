import { NextRequest, NextResponse } from "next/server";

import { Testimonial } from "../../../entities/Testimonial";

import { connectDatabase } from "../../../lib/database";

import { mkdir, unlink, writeFile } from "fs/promises";

import path from "path";

import { randomUUID } from "crypto";

export const runtime = "nodejs";

/* =========================================================
   IMAGE EXTENSION
========================================================= */

function getImageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  };

  return extensions[file.type] || null;
}

/* =========================================================
   SAFE FILE NAME
========================================================= */

function createSafeFileName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* =========================================================
   GET /api/testimonials
========================================================= */

export async function GET() {
  try {
    const database = await connectDatabase();

    const repository = database.getRepository(Testimonial);

    const testimonials = await repository.find({
      order: {
        displayOrder: "ASC",
        createdAt: "DESC",
      },
    });

    return NextResponse.json({
      success: true,
      testimonials,
    });
  } catch (error) {
    console.error("GET TESTIMONIALS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch testimonials",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST /api/testimonials
========================================================= */

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;

  try {
    /* =====================================================
       CHECK CONTENT TYPE
    ===================================================== */

    const contentType = request.headers.get("content-type");

    console.log("TESTIMONIAL CONTENT TYPE:", contentType);

    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          message: "Request must use multipart/form-data.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       READ FORM DATA
    ===================================================== */

    const formData = await request.formData();

    /* =====================================================
       DEFAULT VALUES
    ===================================================== */

    let name = "";
    let role = "";
    let company = "";
    let message = "";

    let isPublished = true;
    let displayOrder = 0;

    let imageFile: File | null = null;

    /* =====================================================
       READ FORM DATA
    ===================================================== */

    for (const [rawKey, value] of formData.entries()) {
      /*
       * IMPORTANT:
       * Normalize the key.
       *
       * Example:
       *
       * "name"
       * " name"
       * "name "
       * "NAME"
       *
       * all become:
       *
       * "name"
       */

      const key = rawKey.trim().toLowerCase();

      console.log(
        "FORM FIELD:",
        JSON.stringify(rawKey),
        "=>",
        JSON.stringify(key),
        value instanceof File ? `FILE: ${value.name}` : value,
      );

      /* ===================================================
         NAME
      =================================================== */

      if (key === "name" && typeof value === "string") {
        name = value.trim();
      } else if (key === "role" && typeof value === "string") {

      /* ===================================================
         ROLE
      =================================================== */
        role = value.trim();
      } else if (key === "company" && typeof value === "string") {

      /* ===================================================
         COMPANY
      =================================================== */
        company = value.trim();
      } else if (key === "message" && typeof value === "string") {

      /* ===================================================
         MESSAGE
      =================================================== */
        message = value.trim();
      } else if (key === "ispublished" && typeof value === "string") {

      /* ===================================================
         IS PUBLISHED
      =================================================== */
        const publishedValue = value.trim().toLowerCase();

        isPublished = publishedValue === "true" || publishedValue === "1";
      } else if (key === "displayorder" && typeof value === "string") {

      /* ===================================================
         DISPLAY ORDER
      =================================================== */
        const parsedOrder = Number(value.trim());

        if (!Number.isNaN(parsedOrder)) {
          displayOrder = parsedOrder;
        }
      } else if (key === "image" && value instanceof File && value.size > 0) {

      /* ===================================================
         IMAGE
      =================================================== */
        imageFile = value;
      }
    }

    /* =====================================================
       DEBUG
    ===================================================== */

    console.log("========================================");

    console.log("EXTRACTED NAME:", JSON.stringify(name));

    console.log("EXTRACTED ROLE:", JSON.stringify(role));

    console.log("EXTRACTED COMPANY:", JSON.stringify(company));

    console.log("EXTRACTED MESSAGE:", JSON.stringify(message));

    console.log("EXTRACTED IMAGE:", imageFile?.name);

    console.log("EXTRACTED PUBLISHED:", isPublished);

    console.log("EXTRACTED ORDER:", displayOrder);

    console.log("========================================");

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "Message is required.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       DATABASE
    ===================================================== */

    const database = await connectDatabase();

    const repository = database.getRepository(Testimonial);

    /* =====================================================
       IMAGE UPLOAD
    ===================================================== */

    let imageUrl: string | null = null;

    if (imageFile) {
      /* ===================================================
         FILE SIZE
      =================================================== */

      const MAX_FILE_SIZE = 5 * 1024 * 1024;

      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: "Image must be less than 5MB.",
          },
          {
            status: 400,
          },
        );
      }

      /* ===================================================
         FILE TYPE
      =================================================== */

      const extension = getImageExtension(imageFile);

      if (!extension) {
        return NextResponse.json(
          {
            success: false,
            message: "Only PNG, JPG and WEBP images are allowed.",
          },
          {
            status: 400,
          },
        );
      }

      /* ===================================================
         UPLOAD DIRECTORY
      =================================================== */

      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "testimonials",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      /* ===================================================
         FILE NAME
      =================================================== */

      const safeName = createSafeFileName(name);

      const fileName = `${safeName}-${randomUUID()}${extension}`;

      const filePath = path.join(uploadDirectory, fileName);

      /* ===================================================
         SAVE IMAGE
      =================================================== */

      const bytes = await imageFile.arrayBuffer();

      await writeFile(filePath, Buffer.from(bytes));

      uploadedFilePath = filePath;

      imageUrl = `/uploads/testimonials/${fileName}`;

      console.log("IMAGE SAVED:", imageUrl);
    }

    /* =====================================================
       CREATE TESTIMONIAL
    ===================================================== */

    const testimonial = repository.create({
      name,
      role: role || null,
      company: company || null,
      message,
      imageUrl,
      isPublished,
      displayOrder,
    });

    /* =====================================================
       SAVE
    ===================================================== */

    const savedTestimonial = await repository.save(testimonial);

    console.log("TESTIMONIAL CREATED:", savedTestimonial);

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message: "Testimonial created successfully",
        testimonial: savedTestimonial,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    /* =====================================================
       CLEANUP IMAGE
    ===================================================== */

    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch (cleanupError) {
        console.error("IMAGE CLEANUP ERROR:", cleanupError);
      }
    }

    /* =====================================================
       ERROR
    ===================================================== */

    console.error("CREATE TESTIMONIAL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create testimonial",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
