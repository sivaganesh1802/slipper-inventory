import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPurchases, createPurchase } from "@/lib/db";

// GET /api/purchases?artNo=...&size=...
export async function GET(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const artNo = searchParams.get("artNo") || undefined;
    const size = searchParams.get("size") || undefined;

    const purchases = await getPurchases({ artNo, size });
    return NextResponse.json({ success: true, purchases });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch purchases" }, { status: 500 });
  }
}

// POST /api/purchases
export async function POST(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  try {
    const body = await req.json();
    const { artNo, size, purchaseDate, purchaseValue, sellingPrice, quantity, sizes, image, notes } = body;

    // Validate fields requested by user
    if (!artNo || !artNo.trim()) {
      return NextResponse.json({ success: false, error: "Art.No is required" }, { status: 400 });
    }
    if (!purchaseDate) {
      return NextResponse.json({ success: false, error: "Purchase Date is required" }, { status: 400 });
    }
    if (purchaseValue === undefined || purchaseValue === null || Number(purchaseValue) < 0) {
      return NextResponse.json({ success: false, error: "Valid Purchase Cost is required" }, { status: 400 });
    }

    const parsedSellingPrice =
      sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== ""
        ? Number(sellingPrice)
        : 0;

    // Multi-size batch creation
    if (Array.isArray(sizes) && sizes.length > 0) {
      const validSizes = sizes.filter(
        (s: { size: string; quantity: number | string }) => s.size && Number(s.quantity) > 0
      );

      if (validSizes.length === 0) {
        return NextResponse.json(
          { success: false, error: "Please enter quantity for at least one selected size" },
          { status: 400 }
        );
      }

      const createdPurchases = [];
      for (const item of validSizes) {
        const itemQty = Number(item.quantity) || 1;
        const newPurchase = await createPurchase({
          artNo: artNo.toUpperCase().trim(),
          size: String(item.size).trim(),
          purchaseDate,
          purchaseValue: Number(purchaseValue),
          sellingPrice: parsedSellingPrice,
          quantity: itemQty,
          image: image || "",
          notes: notes || "",
        });
        createdPurchases.push(newPurchase);
      }

      return NextResponse.json(
        { success: true, purchases: createdPurchases, count: createdPurchases.length },
        { status: 201 }
      );
    }

    // Single size fallback
    if (!size || !size.trim()) {
      return NextResponse.json({ success: false, error: "Size is required" }, { status: 400 });
    }

    const newPurchase = await createPurchase({
      artNo: artNo.toUpperCase().trim(),
      size: size.trim(),
      purchaseDate,
      purchaseValue: Number(purchaseValue),
      sellingPrice: parsedSellingPrice,
      quantity: Number(quantity) || 1,
      image: image || "",
      notes: notes || "",
    });

    return NextResponse.json({ success: true, purchase: newPurchase }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json({ success: false, error: "Failed to save purchase" }, { status: 500 });
  }
}
