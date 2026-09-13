import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import configJson from "../config.json";

const AUTH_COOKIE_NAME = "slipper_auth_token";
const JWT_SECRET_STRING =
  process.env.JWT_SECRET ||
  configJson.auth?.jwt_secret ||
  "super_secret_slipper_jwt_key_2026_production_grade_secured";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, api routes, and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.includes(".") // favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // If user is accessing /login and is already authenticated, redirect to /
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // If user is accessing protected web pages without authentication, redirect to /login
  if (!isAuthenticated && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
