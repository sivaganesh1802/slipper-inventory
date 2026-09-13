import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteSale } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  try {
    const { id } = await context.params;
    const deleted = await deleteSale(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Sale record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Sale record deleted" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json({ success: false, error: "Failed to delete sale" }, { status: 500 });
  }
}
