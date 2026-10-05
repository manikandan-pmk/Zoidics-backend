import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not configured");
}

const JWT_SECRET = new TextEncoder().encode(secret);

export type AuthPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
};

export async function verifyAuthToken(
  token: string
): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);

  console.log("========== JWT PAYLOAD ==========");
  console.log(payload);
  console.log("role:", payload.role);
  console.log("isAdmin:", payload.isAdmin);
  console.log("================================");

  return {
    id: String(payload.id),
    name: String(payload.name),
    email: String(payload.email),
    role: String(payload.role),
    isAdmin: Boolean(payload.isAdmin),
  };
}

export async function proxy(request: NextRequest) {

  // =========================
  // CORS
  // =========================

  const allowedOrigins = [
    "https://zoidics.com",
    "https://www.zoidics.com",
  ];

  const origin = request.headers.get("origin");

  // Handle CORS preflight
  if (
    request.method === "OPTIONS" &&
    origin &&
    allowedOrigins.includes(origin)
  ) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
      },
    });
  }

  // =========================
  // JWT AUTH
  // =========================

  const token = request.cookies.get("jwt")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const user = await verifyAuthToken(token);

    if (!user.isAdmin || user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const response = NextResponse.next();

    // Add CORS headers to API response
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set(
        "Access-Control-Allow-Origin",
        origin
      );

      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );

      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      response.headers.set(
        "Access-Control-Allow-Credentials",
        "true"
      );

      response.headers.set("Vary", "Origin");
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
  ],
};