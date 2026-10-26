import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

import { connectDatabase } from "../../../../lib/database";
import { Admin } from "../../../../entities/Admin";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export async function POST(request: NextRequest) {
  try {
    // -----------------------------
    // Get request body
    // -----------------------------
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    // -----------------------------
    // Validate input
    // -----------------------------
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Connect database
    // -----------------------------
    const database = await connectDatabase();

    console.log("DATABASE:", process.env.DB_NAME);

    const adminRepository = database.getRepository(Admin);

    // -----------------------------
    // Find admin
    // -----------------------------
    const admin = await adminRepository.findOne({
      where: {
        email,
      },
    });

    console.log("LOGIN EMAIL:", email);
    console.log("ADMIN FOUND:", !!admin);

    // -----------------------------
    // Admin not found
    // -----------------------------
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    console.log("ADMIN ID:", admin.id);
    console.log("ADMIN EMAIL:", admin.email);
    console.log("ADMIN ROLE:", admin.role);
    console.log("HASH EXISTS:", !!admin.password);
    console.log("HASH LENGTH:", admin.password?.length);

    // -----------------------------
    // Check admin role
    // -----------------------------
    if (admin.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 },
      );
    }

    // -----------------------------
    // Check password
    // -----------------------------
    const passwordMatches = await bcrypt.compare(password, admin.password);

    console.log("PASSWORD MATCH:", passwordMatches);

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    // -----------------------------
    // Create JWT
    // -----------------------------
    const token = await new SignJWT({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  isAdmin: true,
})
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getJwtSecret());

    // -----------------------------
    // Create response
    // -----------------------------
    const response = NextResponse.json({
      success: true,
      message: "Login successful.",

      token,

      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    // -----------------------------
    // Store JWT in HTTP-only cookie
    // -----------------------------
    response.cookies.set({
      name: "jwt",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login failed.",
      },
      { status: 500 },
    );
  }
}
