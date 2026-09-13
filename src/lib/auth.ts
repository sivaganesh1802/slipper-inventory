import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { IUser } from "./types";
import { getAppConfig } from "./config";

export const AUTH_COOKIE_NAME = "slipper_auth_token";

function getSecretKey(): Uint8Array {
  const cfg = getAppConfig();
  const secret = cfg.auth.jwt_secret || "super_secret_slipper_jwt_key_2026_production_grade_secured";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function signToken(user: IUser): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<IUser | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: String(payload.id),
      username: String(payload.username),
      name: String(payload.name),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

// Authenticate user credentials against config.json admin or MongoDB user
export async function authenticateCredentials(username: string, password: string): Promise<IUser | null> {
  const cleanUser = username.toLowerCase().trim();
  const cfg = getAppConfig();
  const adminUser = (cfg.auth.admin_username || "admin").toLowerCase().trim();
  const adminPass = cfg.auth.admin_password || "admin123";

  // Check against config.json admin
  if (cleanUser === adminUser && password === adminPass) {
    return {
      id: "admin-01",
      username: adminUser,
      name: `${cfg.app.business_name} Admin`,
      role: "admin",
    };
  }

  // Check MongoDB User if available
  try {
    const { connectMongo } = await import("./db");
    const isCloud = await connectMongo();
    if (isCloud) {
      const { UserModel } = await import("@/models/schemas");
      const dbUser = await UserModel.findOne({ username: cleanUser });
      if (dbUser && (await comparePassword(password, dbUser.passwordHash))) {
        return {
          id: String(dbUser._id),
          username: dbUser.username,
          name: dbUser.name,
          role: dbUser.role,
        };
      }
    }
  } catch (err) {
    console.error("Error in DB credential verification:", err);
  }

  return null;
}

// Extract current user from NextRequest (Cookie or Bearer header)
export async function getAuthUser(req?: NextRequest): Promise<IUser | null> {
  let token: string | undefined;

  if (req) {
    // 1. Check Bearer Authorization Header
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    // 2. Check Request Cookie
    if (!token) {
      token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    }
  }

  // 3. Check Next.js server cookie store if no token yet
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Cookies not accessible in this context
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

// Reusable API Route Guard: protects every API execution
export async function requireAuth(req: NextRequest): Promise<
  | { authenticated: true; user: IUser }
  | { authenticated: false; response: NextResponse }
> {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Authentication token is missing or expired. Please login.",
        },
        { status: 401 }
      ),
    };
  }
  return { authenticated: true, user };
}
