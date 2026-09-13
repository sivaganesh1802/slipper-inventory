import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSales, createSale } from "@/lib/db";

// GET /api/sales?artNo=...&customerName=...&date=...
export async function GET(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const artNo = searchParams.get("artNo") || undefined;
    const customerName = searchParams.get("customerName") || undefined;
    const date = searchParams.get("date") || undefined;

    const sales = await getSales({ artNo, customerName, date });
    return NextResponse.json({ success: true, sales });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sales" }, { status: 500 });
  }
}

// POST /api/sales
export async function POST(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  try {
    const body = await req.json();
    const { artNo, customerName, size, salesDate, salesValue, quantity, purchaseValue, notes } = body;

    // Validate fields requested by user
    if (!artNo || !artNo.trim()) {
      return NextResponse.json({ success: false, error: "Art.No is required" }, { status: 400 });
    }
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ success: false, error: "Customer Name is required" }, { status: 400 });
    }
    if (!size || !size.trim()) {
      return NextResponse.json({ success: false, error: "Size is required" }, { status: 400 });
    }
    if (salesValue === undefined || salesValue === null || Number(salesValue) < 0) {
      return NextResponse.json({ success: false, error: "Valid Sales Value is required" }, { status: 400 });
    }

    const newSale = await createSale({
      artNo,
      customerName,
      size,
      salesDate: salesDate || new Date().toISOString().split("T")[0],
      salesValue: Number(salesValue),
      quantity: Number(quantity) || 1,
      purchaseValue: purchaseValue !== undefined ? Number(purchaseValue) : undefined,
      notes: notes || "",
    });

    return NextResponse.json({ success: true, sale: newSale }, { status: 201 });
  } catch (error) {
    console.error("Error recording sale:", error);
    return NextResponse.json({ success: false, error: "Failed to record sale" }, { status: 500 });
  }
}
