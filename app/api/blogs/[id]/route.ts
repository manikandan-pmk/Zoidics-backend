import { NextRequest, NextResponse } from "next/server";

import { Blog } from "../../../../entities/Blog";
import { connectDatabase } from "../../../../lib/database";

import { mkdir, unlink, writeFile } from "fs/promises";

import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

/* =========================================================
   HELPERS
========================================================= */

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function createSafeFileName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getImageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  };

  return extensions[file.type] || null;
}

/* =========================================================
   GET /api/blogs/:id

   Get single blog
========================================================= */

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await context.params;

    const blogId = Number(id);

    if (!Number.isInteger(blogId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog ID.",
        },
        {
          status: 400,
        },
      );
    }

    const database = await connectDatabase();

    const repository = database.getRepository(Blog);

    const blog = await repository.findOne({
      where: {
        id: blogId,
      },
    });

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("GET BLOG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blog.",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   PUT /api/blogs/:id

   Update blog

   Content-Type:
   multipart/form-data

   Fields:
   title
   category
   excerpt
   content
   image
   isPublished
   displayOrder
   removeImage
========================================================= */

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  let newUploadedFilePath: string | null = null;

  try {
    const { id } = await context.params;

    const blogId = Number(id);

    if (!Number.isInteger(blogId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog ID.",
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

    const blog = await repository.findOne({
      where: {
        id: blogId,
      },
    });

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found.",
        },
        {
          status: 404,
        },
      );
    }

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

    let title = blog.title;
    let category = blog.category;
    let excerpt = blog.excerpt;
    let content = blog.content;

    let isPublished = blog.isPublished;

    let displayOrder = blog.displayOrder;

    let imageFile: File | null = null;

    let removeImage = false;

    /* =====================================================
       READ FORM DATA
    ===================================================== */

    for (const [rawKey, value] of formData.entries()) {
      const key = rawKey.trim().toLowerCase();

      if (key === "title" && typeof value === "string") {
        title = value.trim();
      } else if (key === "category" && typeof value === "string") {
        category = value.trim();
      } else if (key === "excerpt" && typeof value === "string") {
        excerpt = value.trim();
      } else if (key === "content" && typeof value === "string") {
        content = value.trim();
      } else if (key === "ispublished" && typeof value === "string") {
        const published = value.trim().toLowerCase();

        isPublished = published === "true" || published === "1";
      } else if (key === "displayorder" && typeof value === "string") {
        const order = Number(value.trim());

        if (!Number.isNaN(order)) {
          displayOrder = order;
        }
      } else if (key === "removeimage" && typeof value === "string") {
        const remove = value.trim().toLowerCase();

        removeImage = remove === "true" || remove === "1";
      } else if (key === "image" && value instanceof File && value.size > 0) {
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
       SLUG
    ===================================================== */

    let slug = createSlug(title);

    const existingBlog = await repository.findOne({
      where: {
        slug,
      },
    });

    if (existingBlog && existingBlog.id !== blog.id) {
      slug = `${slug}-${randomUUID().split("-")[0]}`;
    }

    /* =====================================================
       IMAGE
    ===================================================== */

    let imageUrl = blog.imageUrl;

    const oldImageUrl = blog.imageUrl;

    /* -----------------------------------------------------
       REMOVE EXISTING IMAGE
    ----------------------------------------------------- */

    if (removeImage && !imageFile) {
      imageUrl = null;
    }

    /* -----------------------------------------------------
       NEW IMAGE
    ----------------------------------------------------- */

    if (imageFile) {
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

      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "blogs",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      const safeName = createSafeFileName(title);

      const fileName = `${safeName}-${randomUUID()}${extension}`;

      const filePath = path.join(uploadDirectory, fileName);

      const bytes = await imageFile.arrayBuffer();

      await writeFile(filePath, Buffer.from(bytes));

      newUploadedFilePath = filePath;

      imageUrl = `/uploads/blogs/${fileName}`;

      console.log("NEW BLOG IMAGE:", imageUrl);
    }

    /* =====================================================
       UPDATE ENTITY
    ===================================================== */

    blog.title = title;
    blog.slug = slug;
    blog.category = category;
    blog.excerpt = excerpt;
    blog.content = content;
    blog.imageUrl = imageUrl;
    blog.isPublished = isPublished;
    blog.displayOrder = displayOrder;

    /* =====================================================
       SAVE
    ===================================================== */

    const updatedBlog = await repository.save(blog);

    /* =====================================================
       DELETE OLD IMAGE
       Only after successful database save
    ===================================================== */

    if ((imageFile || removeImage) && oldImageUrl && oldImageUrl !== imageUrl) {
      try {
        const oldImagePath = path.join(
          process.cwd(),
          "public",
          oldImageUrl.replace(/^\//, ""),
        );

        await unlink(oldImagePath);

        console.log("OLD BLOG IMAGE DELETED:", oldImagePath);
      } catch (error) {
        console.warn("OLD BLOG IMAGE DELETE WARNING:", error);
      }
    }

    newUploadedFilePath = null;

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    /* =====================================================
       CLEANUP NEW IMAGE IF DATABASE FAILED
    ===================================================== */

    if (newUploadedFilePath) {
      try {
        await unlink(newUploadedFilePath);
      } catch (cleanupError) {
        console.error("NEW IMAGE CLEANUP ERROR:", cleanupError);
      }
    }

    console.error("UPDATE BLOG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update blog.",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   DELETE /api/blogs/:id
========================================================= */

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await context.params;

    const blogId = Number(id);

    if (!Number.isInteger(blogId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog ID.",
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

    const blog = await repository.findOne({
      where: {
        id: blogId,
      },
    });

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found.",
        },
        {
          status: 404,
        },
      );
    }

    /* =====================================================
       SAVE IMAGE PATH
    ===================================================== */

    const imageUrl = blog.imageUrl;

    /* =====================================================
       DELETE DATABASE RECORD
    ===================================================== */

    await repository.remove(blog);

    /* =====================================================
       DELETE IMAGE FILE
    ===================================================== */

    if (imageUrl) {
      try {
        const imagePath = path.join(
          process.cwd(),
          "public",
          imageUrl.replace(/^\//, ""),
        );

        await unlink(imagePath);

        console.log("BLOG IMAGE DELETED:", imagePath);
      } catch (error) {
        console.warn("BLOG IMAGE DELETE WARNING:", error);
      }
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
      deletedId: blogId,
    });
  } catch (error) {
    console.error("DELETE BLOG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete blog.",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
