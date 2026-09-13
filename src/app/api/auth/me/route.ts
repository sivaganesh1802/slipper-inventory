import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  return NextResponse.json({
    success: true,
    user: authCheck.user,
  });
}
