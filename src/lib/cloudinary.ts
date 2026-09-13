import { v2 as cloudinary } from "cloudinary";
import { getAppConfig } from "./config";

export function configureCloudinary() {
  const cfg = getAppConfig();
  const cName = cfg.cloudinary?.cloud_name?.trim();
  const aKey = cfg.cloudinary?.api_key?.trim();
  const aSecret = cfg.cloudinary?.api_secret?.trim();

  if (!cName || !aKey || !aSecret) {
    throw new Error("Cloudinary credentials are not properly configured in config.json");
  }

  cloudinary.config({
    cloud_name: cName,
    api_key: aKey,
    api_secret: aSecret,
    secure: true,
  });

  return cloudinary;
}

export async function uploadToCloudinary(
  fileData: string,
  folder: string = "slipper_inventory/products"
): Promise<{ url: string; public_id: string }> {
  const cld = configureCloudinary();

  const uploadRes = await cld.uploader.upload(fileData, {
    folder,
    transformation: [
      { width: 900, height: 900, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });

  return {
    url: uploadRes.secure_url,
    public_id: uploadRes.public_id,
  };
}
