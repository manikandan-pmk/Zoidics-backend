import { NextRequest, NextResponse } from "next/server";
import { Service } from "../../../../entities/Service";
import { connectDatabase } from "../../../../lib/database";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getImageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  };

  return extensions[file.type] || null;
}

async function deleteLocalImage(imageUrl: string | null) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/services/")) {
    return;
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    imageUrl.replace(/^\/+/, ""),
  );

  try {
    await unlink(filePath);
  } catch (error) {
    console.warn("IMAGE DELETE WARNING:", error);
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/services/:id
|--------------------------------------------------------------------------
*/

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const serviceId = Number(id);

    if (!Number.isInteger(serviceId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service ID",
        },
        {
          status: 400,
        },
      );
    }

    const database = await connectDatabase();

    const repository = database.getRepository(Service);

    const service = await repository.findOne({
      where: {
        id: serviceId,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "Service not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("GET SERVICE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch service",
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
| PUT /api/services/:id
|--------------------------------------------------------------------------
*/

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const serviceId = Number(id);

    if (!Number.isInteger(serviceId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service ID",
        },
        {
          status: 400,
        },
      );
    }

    const database = await connectDatabase();

    const repository = database.getRepository(Service);

    const service = await repository.findOne({
      where: {
        id: serviceId,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "Service not found",
        },
        {
          status: 404,
        },
      );
    }

    const formData = await request.formData();

    const nameValue = formData.get("name");

    const imageValue = formData.get("image");

    const isPublishedValue = formData.get("isPublished");

    const displayOrderValue = formData.get("displayOrder");

    if (typeof nameValue === "string") {
      const name = nameValue.trim();

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Service name cannot be empty.",
          },
          {
            status: 400,
          },
        );
      }

      service.name = name;
    }

    if (typeof isPublishedValue === "string") {
      service.isPublished = isPublishedValue === "true";
    }

    if (typeof displayOrderValue === "string") {
      service.displayOrder = Number(displayOrderValue) || 0;
    }

    /*
    |--------------------------------------------------------------------------
    | Replace image
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

      const safeName = service.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const fileName = `${safeName}-${randomUUID()}${extension}`;

      const filePath = path.join(uploadDirectory, fileName);

      const bytes = await imageValue.arrayBuffer();

      await writeFile(filePath, Buffer.from(bytes));

      const oldImage = service.imageUrl;

      service.imageUrl = `/uploads/services/${fileName}`;

      await deleteLocalImage(oldImage);
    }

    const updatedService = await repository.save(service);

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update service",
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
| DELETE /api/services/:id
|--------------------------------------------------------------------------
*/

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const serviceId = Number(id);

    if (!Number.isInteger(serviceId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service ID",
        },
        {
          status: 400,
        },
      );
    }

    const database = await connectDatabase();

    const repository = database.getRepository(Service);

    const service = await repository.findOne({
      where: {
        id: serviceId,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "Service not found",
        },
        {
          status: 404,
        },
      );
    }

    await repository.remove(service);

    await deleteLocalImage(service.imageUrl);

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SERVICE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete service",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
