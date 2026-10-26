import { NextRequest, NextResponse } from "next/server";
import { Project } from "../../../entities/Project";
import { connectDatabase } from "../../../lib/database";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseBoolean(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return false;
  }

  return value.toLowerCase() === "true";
}

function getImageExtension(file: File) {
  const mimeToExtension: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  return mimeToExtension[file.type] || null;
}


export async function GET() {
  try {
    const database = await connectDatabase();

    const projectRepository = database.getRepository(Project);

    const projects = await projectRepository.find({
      where: {
        isPublished: true,
      },
      order: {
        createdAt: "DESC",
      },
    });

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("GET PROJECTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch projects",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}



export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;

  try {
    /*
     * IMPORTANT:
     * We are receiving multipart/form-data from Postman.
     *
     * DO NOT use request.json()
     */
    const formData = await request.formData();

    const titleValue = formData.get("title");
    const categoryValue = formData.get("category");
    const shortDescriptionValue = formData.get("shortDescription");
    const descriptionValue = formData.get("description");
    const technologiesValue = formData.get("technologies");
    const imageValue = formData.get("image");
    const liveUrlValue = formData.get("liveUrl");
    const isPublishedValue = formData.get("isPublished");

    /*
     * Convert form values to strings
     */
    const title = typeof titleValue === "string" ? titleValue.trim() : "";

    const category =
      typeof categoryValue === "string" ? categoryValue.trim() : "";

    const shortDescription =
      typeof shortDescriptionValue === "string"
        ? shortDescriptionValue.trim()
        : "";

    const description =
      typeof descriptionValue === "string" ? descriptionValue.trim() : "";

    const liveUrl = typeof liveUrlValue === "string" ? liveUrlValue.trim() : "";

    /*
     * Required fields
     */
    if (!title || !category || !shortDescription || !description) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title, category, short description and description are required.",
        },
        {
          status: 400,
        },
      );
    }


    let technologies: string[] = [];

    if (typeof technologiesValue === "string") {
      technologies = technologiesValue
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean);
    }

   
    const isPublished = parseBoolean(isPublishedValue);

    /*
     * Database connection
     */
    const database = await connectDatabase();

    const projectRepository = database.getRepository(Project);

    /*
     * Generate slug
     */
    let slug = createSlug(title);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project title.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Check duplicate slug
     */
    const existingProject = await projectRepository.findOne({
      where: {
        slug,
      },
    });

    /*
     * Make slug unique
     */
    if (existingProject) {
      slug = `${slug}-${Date.now()}`;
    }

    /*
     * IMAGE UPLOAD
     */
    let imageUrl: string | null = null;

    if (imageValue instanceof File && imageValue.size > 0) {
      /*
       * Maximum image size = 5 MB
       */
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

      /*
       * Validate image type
       */
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

      /*
       * Create:
       *
       * public/uploads/projects
       */
      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "projects",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      
      const safeTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const fileName = `${safeTitle}-${randomUUID()}${extension}`;

      const filePath = path.join(uploadDirectory, fileName);

      /*
       * Convert File → Buffer
       */
      const bytes = await imageValue.arrayBuffer();

      const buffer = Buffer.from(bytes);

      /*
       * Save image
       */
      await writeFile(filePath, buffer);

      uploadedFilePath = filePath;

      /*
       * This URL will be saved in database
       */
      imageUrl = `/uploads/projects/${fileName}`;
    }

    /*
     * Create project
     */
    const project = projectRepository.create({
      title,
      slug,
      category,
      shortDescription,
      description,
      technologies,
      imageUrl,
      liveUrl: liveUrl || null,
      isPublished,
    });

    /*
     * Save database record
     */
    const savedProject = await projectRepository.save(project);

    /*
     * Success
     */
    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        project: savedProject,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    /*
     * If database save fails after image upload,
     * remove the uploaded image.
     */
    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch (deleteError) {
        console.error("FAILED TO DELETE UPLOADED IMAGE:", deleteError);
      }
    }

    console.error("CREATE PROJECT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create project",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
