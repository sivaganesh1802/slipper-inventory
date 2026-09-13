import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAppConfig } from "@/lib/config";

export async function GET() {
  const cfg = getAppConfig();
  const uri = cfg.database?.mongodb_uri || "";
  const maskedUri = uri ? uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@") : "none";

  let connectSuccess = false;
  let errorDetail = null;

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri, {
        dbName: "slipper_inventory",
        serverSelectionTimeoutMS: 5000,
      });
    }
    connectSuccess = mongoose.connection.readyState === 1;
  } catch (err: any) {
    errorDetail = {
      name: err.name,
      message: err.message,
      code: err.code,
      reason: err.reason?.message || null,
    };
  }

  return NextResponse.json({
    platform: process.platform,
    isVercel: !!process.env.VERCEL,
    hasEnvUri: !!process.env.MONGODB_URI,
    maskedUri,
    readyState: mongoose.connection.readyState,
    connectSuccess,
    errorDetail,
  });
}
