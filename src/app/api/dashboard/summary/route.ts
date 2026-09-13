import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/db";

// GET /api/dashboard/summary
export async function GET(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  try {
    const summary = await getDashboardSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json({ success: false, error: "Failed to generate dashboard summary" }, { status: 500 });
  }
}
