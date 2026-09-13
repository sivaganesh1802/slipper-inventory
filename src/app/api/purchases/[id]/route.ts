import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updatePurchase, deletePurchase } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const updated = await updatePurchase(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Purchase record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, purchase: updated });
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json({ success: false, error: "Failed to update purchase" }, { status: 500 });
  }
}

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
    const deleted = await deletePurchase(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Purchase record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Purchase record deleted" });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json({ success: false, error: "Failed to delete purchase" }, { status: 500 });
  }
}
