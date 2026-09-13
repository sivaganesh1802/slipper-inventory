import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { UserModel } from "@/models/schemas";
import bcrypt from "bcryptjs";

// GET /api/users - List users (passwords excluded)
export async function GET() {
  try {
    const isCloud = await connectMongo();
    if (!isCloud) {
      return NextResponse.json({
        success: true,
        users: [{ username: "admin", name: "Administrator", role: "admin" }],
      });
    }

    const users = await UserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/users - Add a new user into MongoDB 'users' collection
export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const body = await req.json();
    const { username, password, name, role } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Username, password, and name are required" },
        { status: 400 }
      );
    }

    const cleanUser = username.toLowerCase().trim();
    const existing = await UserModel.findOne({ username: cleanUser });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `User '${cleanUser}' already exists` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      username: cleanUser,
      passwordHash,
      name: name.trim(),
      role: role || "staff",
    });

    return NextResponse.json({
      success: true,
      message: `User '${cleanUser}' created successfully in MongoDB users collection!`,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
