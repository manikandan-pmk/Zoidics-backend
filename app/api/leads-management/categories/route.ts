import { NextRequest, NextResponse } from "next/server";
import { LeadCategoryRepo } from "@/lib/repository";


export async function GET(_request: NextRequest) {
  try {
    const categories = await LeadCategoryRepo.find({
      order: { name: "ASC" },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required (maximum 100 characters)",
        },
        { status: 400 },
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "Description cannot exceed 2000 characters",
        },
        { status: 400 },
      );
    }

    const slug = name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid category name",
        },
        { status: 400 },
      );
    }

    const existing = await LeadCategoryRepo.findOne({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "This category already exists",
        },
        { status: 409 },
      );
    }

    const category = LeadCategoryRepo.create({
      name,
      slug,
      description: description || null,
      isActive: true,
    });

    const savedCategory = await LeadCategoryRepo.save(category);

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        data: savedCategory,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
      },
      { status: 500 },
    );
  }
}