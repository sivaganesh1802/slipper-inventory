import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchProducts } from "@/lib/db";

// GET /api/products/search?q=...
export async function GET(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const results = await searchProducts(query);
    return NextResponse.json({ success: true, count: results.length, products: results });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json({ success: false, error: "Failed to search products" }, { status: 500 });
  }
}
