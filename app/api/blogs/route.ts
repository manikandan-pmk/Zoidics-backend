import { NextRequest, NextResponse } from "next/server";

import { Blog } from "../../../entities/Blog";

import { connectDatabase } from "../../../lib/database";

import { mkdir, unlink, writeFile } from "fs/promises";

import path from "path";

import { randomUUID } from "crypto";

export const runtime = "nodejs";

/* =========================================================
   CREATE SLUG
========================================================= */

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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
   GET /api/blogs
========================================================= */

export async function GET() {
  try {
    const database = await connectDatabase();

    const repository = database.getRepository(Blog);

    const blogs = await repository.find({
      where: {
        isPublished: true,
      },
      order: {
        displayOrder: "ASC",
        createdAt: "DESC",
      },
    });

    return NextResponse.json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error("GET BLOGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blogs",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST /api/blogs
========================================================= */

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;

  try {
    /* =====================================================
       CONTENT TYPE
    ===================================================== */

    const contentType = request.headers.get("content-type");

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
       FORM DATA
    ===================================================== */

    const formData = await request.formData();

    let title = "";
    let category = "";
    let excerpt = "";
    let content = "";

    let isPublished = false;
    let displayOrder = 0;

    let imageFile: File | null = null;

    /* =====================================================
       READ FORM DATA
    ===================================================== */

    for (const [rawKey, value] of formData.entries()) {
      const key = rawKey.trim().toLowerCase();

      console.log(
        "BLOG FORM FIELD:",
        JSON.stringify(rawKey),
        "=>",
        value instanceof File ? `FILE: ${value.name}` : value,
      );

      /* ---------------------------------------------------
         TITLE
      --------------------------------------------------- */

      if (key === "title" && typeof value === "string") {
        title = value.trim();
      } else if (key === "category" && typeof value === "string") {

      /* ---------------------------------------------------
         CATEGORY
      --------------------------------------------------- */
        category = value.trim();
      } else if (key === "excerpt" && typeof value === "string") {

      /* ---------------------------------------------------
         EXCERPT
      --------------------------------------------------- */
        excerpt = value.trim();
      } else if (key === "content" && typeof value === "string") {

      /* ---------------------------------------------------
         CONTENT
      --------------------------------------------------- */
        content = value.trim();
      } else if (key === "ispublished" && typeof value === "string") {

      /* ---------------------------------------------------
         PUBLISHED
      --------------------------------------------------- */
        const published = value.trim().toLowerCase();

        isPublished = published === "true" || published === "1";
      } else if (key === "displayorder" && typeof value === "string") {

      /* ---------------------------------------------------
         DISPLAY ORDER
      --------------------------------------------------- */
        const order = Number(value.trim());

        if (!Number.isNaN(order)) {
          displayOrder = order;
        }
      } else if (key === "image" && value instanceof File && value.size > 0) {

      /* ---------------------------------------------------
         IMAGE
      --------------------------------------------------- */
        imageFile = value;
      }
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!excerpt) {
      return NextResponse.json(
        {
          success: false,
          message: "Excerpt is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Content is required.",
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

    const repository = database.getRepository(Blog);

    /* =====================================================
       SLUG
    ===================================================== */

    let slug = createSlug(title);

    const existingBlog = await repository.findOne({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingBlog) {
      slug = `${slug}-${randomUUID().split("-")[0]}`;
    }

    /* =====================================================
       IMAGE
    ===================================================== */

    let imageUrl: string | null = null;

    if (imageFile) {
      /* ---------------------------------------------------
         SIZE
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         TYPE
      --------------------------------------------------- */

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

      /* ---------------------------------------------------
         DIRECTORY
      --------------------------------------------------- */

      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "blogs",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      /* ---------------------------------------------------
         FILE NAME
      --------------------------------------------------- */

      const safeName = createSafeFileName(title);

      const fileName = `${safeName}-${randomUUID()}${extension}`;

      const filePath = path.join(uploadDirectory, fileName);

      /* ---------------------------------------------------
         SAVE
      --------------------------------------------------- */

      const bytes = await imageFile.arrayBuffer();

      await writeFile(filePath, Buffer.from(bytes));

      uploadedFilePath = filePath;

      imageUrl = `/uploads/blogs/${fileName}`;

      console.log("BLOG IMAGE SAVED:", imageUrl);
    }

    /* =====================================================
       CREATE BLOG
    ===================================================== */

    const blog = repository.create({
      title,
      slug,
      category,
      excerpt,
      content,
      imageUrl,
      isPublished,
      displayOrder,
    });

    /* =====================================================
       SAVE
    ===================================================== */

    const savedBlog = await repository.save(blog);

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message: "Blog created successfully",
        blog: savedBlog,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    /* =====================================================
       CLEANUP
    ===================================================== */

    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch (cleanupError) {
        console.error("BLOG IMAGE CLEANUP ERROR:", cleanupError);
      }
    }

    console.error("CREATE BLOG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create blog",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
