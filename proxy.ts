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

export async function verifyAuthToken(token: string): Promise<AuthPayload> {
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
  const token = request.cookies.get("jwt")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const user = await verifyAuthToken(token);

    if (!user.isAdmin || user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
