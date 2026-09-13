import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, artNo } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image data is required" },
        { status: 400 }
      );
    }

    const folder = artNo ? `slipper_inventory/products/${artNo.toUpperCase()}` : "slipper_inventory/products";
    const result = await uploadToCloudinary(image, folder);

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.public_id,
    });
  } catch (err: unknown) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to upload image to Cloudinary" },
      { status: 500 }
    );
  }
}
