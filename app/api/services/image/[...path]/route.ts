import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { path: imagePath } = await context.params;

    if (!imagePath || imagePath.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Image path is required",
        },
        {
          status: 400,
        },
      );
    }

    // Your uploaded service images are stored here
    const uploadDirectory = path.resolve(
      process.cwd(),
      "public",
      "uploads",
      "services",
    );

    const requestedPath = imagePath.join("/");

    const filePath = path.resolve(uploadDirectory, requestedPath);

    // Security check
    if (
      filePath !== uploadDirectory &&
      !filePath.startsWith(`${uploadDirectory}${path.sep}`)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid image path",
        },
        {
          status: 400,
        },
      );
    }

    // Read uploaded image
    const fileBuffer = await readFile(filePath);

    const extension = path.extname(filePath).toLowerCase().replace(".", "");

    const contentType = MIME_TYPES[extension] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("SERVICE IMAGE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Service image not found",
      },
      {
        status: 404,
      },
    );
  }
}
