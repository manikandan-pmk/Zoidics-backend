import { NextRequest, NextResponse } from "next/server";
import { Project } from "../../../../entities/Project";
import { connectDatabase } from "../../../../lib/database";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return value.toLowerCase() === "true";
}

function getImageExtension(file: File): string | null {
  const mimeToExtension: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  return mimeToExtension[file.type] || null;
}

/* -------------------------------------------------------------------------- */
/* GET PROJECT BY ID                                                          */
/* -------------------------------------------------------------------------- */

// GET /api/projects/:id
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const projectId = Number(id);

    if (!Number.isInteger(projectId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID",
        },
        { status: 400 },
      );
    }

    const database = await connectDatabase();
    const projectRepository = database.getRepository(Project);

    const project = await projectRepository.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("GET PROJECT BY ID ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch project",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* UPDATE PROJECT                                                             */
/* -------------------------------------------------------------------------- */

// PUT /api/projects/:id
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  let uploadedFilePath: string | null = null;

  try {
    const { id } = await context.params;

    const projectId = Number(id);

    if (!Number.isInteger(projectId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID",
        },
        { status: 400 },
      );
    }

    /*
     * IMPORTANT:
     * Frontend sends multipart/form-data.
     * DO NOT use request.json() here.
     */
    const formData = await request.formData();

    const titleValue = formData.get("title");
    const categoryValue = formData.get("category");
    const shortDescriptionValue = formData.get("shortDescription");
    const descriptionValue = formData.get("description");
    const technologiesValue = formData.get("technologies");
    const liveUrlValue = formData.get("liveUrl");
    const isPublishedValue = formData.get("isPublished");
    const imageValue = formData.get("image");

    const database = await connectDatabase();
    const projectRepository = database.getRepository(Project);

    const project = await projectRepository.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* UPDATE TEXT FIELDS                                                     */
    /* ---------------------------------------------------------------------- */

    if (typeof titleValue === "string") {
      const title = titleValue.trim();

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            message: "Project title is required.",
          },
          { status: 400 },
        );
      }

      project.title = title;
    }

    if (typeof categoryValue === "string") {
      project.category = categoryValue.trim();
    }

    if (typeof shortDescriptionValue === "string") {
      project.shortDescription = shortDescriptionValue.trim();
    }

    if (typeof descriptionValue === "string") {
      project.description = descriptionValue.trim();
    }

    /* ---------------------------------------------------------------------- */
    /* TECHNOLOGIES                                                            */
    /* ---------------------------------------------------------------------- */

    if (typeof technologiesValue === "string") {
      project.technologies = technologiesValue
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean);
    }

    /* ---------------------------------------------------------------------- */
    /* LIVE URL                                                                */
    /* ---------------------------------------------------------------------- */

    if (typeof liveUrlValue === "string") {
      project.liveUrl = liveUrlValue.trim() || null;
    }

    /* ---------------------------------------------------------------------- */
    /* PUBLISHED STATUS                                                        */
    /* ---------------------------------------------------------------------- */

    if (typeof isPublishedValue === "string") {
      project.isPublished = parseBoolean(isPublishedValue);
    }

    /* ---------------------------------------------------------------------- */
    /* IMAGE UPDATE                                                            */
    /* ---------------------------------------------------------------------- */

    let oldImageUrl: string | null = project.imageUrl;

    if (imageValue instanceof File && imageValue.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;

      if (imageValue.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: "Image size must be less than 5MB.",
          },
          { status: 400 },
        );
      }

      const extension = getImageExtension(imageValue);

      if (!extension) {
        return NextResponse.json(
          {
            success: false,
            message: "Only PNG, JPG and WEBP images are allowed.",
          },
          { status: 400 },
        );
      }

      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "projects",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      const safeTitle = project.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const fileName = `${safeTitle || "project"}-${randomUUID()}${extension}`;

      const filePath = path.join(uploadDirectory, fileName);

      const bytes = await imageValue.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await writeFile(filePath, buffer);

      uploadedFilePath = filePath;

      project.imageUrl = `/uploads/projects/${fileName}`;
    }

    /* ---------------------------------------------------------------------- */
    /* SAVE PROJECT                                                            */
    /* ---------------------------------------------------------------------- */

    const updatedProject = await projectRepository.save(project);

    /* ---------------------------------------------------------------------- */
    /* DELETE OLD IMAGE AFTER SUCCESSFUL DATABASE UPDATE                      */
    /* ---------------------------------------------------------------------- */

    if (
      uploadedFilePath &&
      oldImageUrl &&
      oldImageUrl.startsWith("/uploads/projects/")
    ) {
      try {
        const oldFileName = path.basename(oldImageUrl);

        const oldFilePath = path.join(
          process.cwd(),
          "public",
          "uploads",
          "projects",
          oldFileName,
        );

        await unlink(oldFilePath);
      } catch (deleteError) {
        console.error(
          "FAILED TO DELETE OLD PROJECT IMAGE:",
          deleteError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    /*
     * If database save fails after new image upload,
     * remove the newly uploaded image.
     */
    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch (deleteError) {
        console.error(
          "FAILED TO DELETE NEW UPLOADED IMAGE:",
          deleteError,
        );
      }
    }

    console.error("UPDATE PROJECT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update project",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE PROJECT                                                             */
/* -------------------------------------------------------------------------- */

// DELETE /api/projects/:id
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const projectId = Number(id);

    if (!Number.isInteger(projectId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project ID",
        },
        { status: 400 },
      );
    }

    const database = await connectDatabase();
    const projectRepository = database.getRepository(Project);

    const project = await projectRepository.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 },
      );
    }

    await projectRepository.remove(project);

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete project",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}