
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

  const corsHeaders: Record<string, string> = {};

  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
    corsHeaders["Access-Control-Allow-Methods"] =
      "GET, POST, PUT, DELETE, OPTIONS";
    corsHeaders["Access-Control-Allow-Headers"] =
      "Content-Type, Authorization";
    corsHeaders["Access-Control-Allow-Credentials"] = "true";
    corsHeaders["Vary"] = "Origin";
  }

  // =========================
  // CORS PREFLIGHT
  // =========================

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // =========================
  // PUBLIC GET API ROUTES
  // =========================
  // Only GET requests to these routes are public.
  //
  // GET /api/services
  // GET /api/projects
  // GET /api/testimonials
  // GET /api/blogs
  //
  // POST /api/blogs -> ADMIN
  // PUT /api/blogs -> ADMIN
  // DELETE /api/blogs -> ADMIN

  const publicGetPaths = [
    "/api/services",
    "/api/projects",
    "/api/testimonials",
    "/api/blogs",
  ];

  const isPublicGet =
    method === "GET" &&
    publicGetPaths.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(path + "/")
    );

  if (isPublicGet) {
    const response = NextResponse.next();

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // =========================
  // PUBLIC POST API ROUTES
  // =========================
  // These POST APIs are used by
  // visitors from the public website.
  //
  // POST /api/chat    -> PUBLIC
  // POST /api/contact -> PUBLIC

  const publicPostPaths = [
    "/api/chat",
    "/api/contact",
  ];

  const isPublicPost =
    method === "POST" &&
    publicPostPaths.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(path + "/")
    );

  if (isPublicPost) {
    const response = NextResponse.next();

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // =========================
  // PUBLIC LOGIN
  // =========================
  // Login must be accessible without JWT.
  //
  // POST /api/auth/login -> PUBLIC

  const isLogin =
    pathname === "/api/auth/login" &&
    method === "POST";

  if (isLogin) {
    const response = NextResponse.next();

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // =========================
  // JWT AUTH
  // =========================

  const token = request.cookies.get("jwt")?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  try {
    const user = await verifyAuthToken(token);

    // =========================
    // ADMIN CHECK
    // =========================

    if (!user.isAdmin || user.role !== "admin") {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    // =========================
    // AUTHENTICATED REQUEST
    // =========================

    const response = NextResponse.next();

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
  ],
};