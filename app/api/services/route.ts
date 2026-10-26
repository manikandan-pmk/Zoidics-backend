import { NextRequest, NextResponse } from "next/server";
import { Service } from "../../../entities/Service";
import { connectDatabase } from "../../../lib/database";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function getImageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  };

  return extensions[file.type] || null;
}

/*
|--------------------------------------------------------------------------
| GET /api/services
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const database = await connectDatabase();

    const serviceRepository = database.getRepository(Service);

    const services = await serviceRepository.find({
      order: {
        displayOrder: "ASC",
        createdAt: "DESC",
      },
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("GET SERVICES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch services",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/services
|--------------------------------------------------------------------------
| multipart/form-data
|--------------------------------------------------------------------------
*/

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;

  try {
    const formData = await request.formData();

    const nameValue = formData.get("name");

    const imageValue = formData.get("image");

    const isPublishedValue = formData.get("isPublished");

    const displayOrderValue = formData.get("displayOrder");

    const name = typeof nameValue === "string" ? nameValue.trim() : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Service name is required.",
        },
        {
          status: 400,
        },
      );
    }

    const isPublished =
      typeof isPublishedValue === "string" ? isPublishedValue === "true" : true;

    const displayOrder =
      typeof displayOrderValue === "string"
        ? Number(displayOrderValue) || 0
        : 0;

    const database = await connectDatabase();

    const serviceRepository = database.getRepository(Service);

    let imageUrl: string | null = null;

    /*
    |--------------------------------------------------------------------------
    | Image upload
    |--------------------------------------------------------------------------
    */

    if (imageValue instanceof File && imageValue.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;

      if (imageValue.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: "Image size must be less than 5MB.",
          },
          {
            status: 400,
          },
        );
      }

      const extension = getImageExtension(imageValue);

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
        "services",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      const safeName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const fileName = `${safeName}-${randomUUID()}${extension}`;

      const filePath = path.join(uploadDirectory, fileName);

      const bytes = await imageValue.arrayBuffer();

      await writeFile(filePath, Buffer.from(bytes));

      uploadedFilePath = filePath;

      imageUrl = `/uploads/services/${fileName}`;
    }

    /*
    |--------------------------------------------------------------------------
    | Create service
    |--------------------------------------------------------------------------
    */

    const service = serviceRepository.create({
      name,
      imageUrl,
      isPublished,
      displayOrder,
    });

    const savedService = await serviceRepository.save(service);

    return NextResponse.json(
      {
        success: true,
        message: "Service created successfully",
        service: savedService,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch {
        // Ignore cleanup error
      }
    }

    console.error("CREATE SERVICE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create service",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
