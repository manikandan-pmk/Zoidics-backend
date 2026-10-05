import { NextRequest, NextResponse } from "next/server";
import { Project } from "../../../../entities/Project";
import { connectDatabase } from "../../../../lib/database";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/projects/:id
export async function GET(request: NextRequest, context: RouteContext) {
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

// PUT /api/projects/:id
export async function PUT(request: NextRequest, context: RouteContext) {
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

    const body = await request.json();

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

    if (body.title !== undefined) {
      project.title = body.title.trim();
    }

    if (body.category !== undefined) {
      project.category = body.category.trim();
    }

    if (body.shortDescription !== undefined) {
      project.shortDescription = body.shortDescription.trim();
    }

    if (body.description !== undefined) {
      project.description = body.description.trim();
    }

    if (body.technologies !== undefined) {
      project.technologies = Array.isArray(body.technologies)
        ? body.technologies
        : [];
    }

    if (body.imageUrl !== undefined) {
      project.imageUrl = body.imageUrl?.trim() || null;
    }

    if (body.liveUrl !== undefined) {
      project.liveUrl = body.liveUrl?.trim() || null;
    }

    

    if (body.isPublished !== undefined) {
      project.isPublished = Boolean(body.isPublished);
    }

    const updatedProject = await projectRepository.save(project);

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
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

// DELETE /api/projects/:id
export async function DELETE(request: NextRequest, context: RouteContext) {
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
