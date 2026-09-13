"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface SlipperImagePickerProps {
  value: string;
  artNo: string;
  onChange: (url: string) => void;
}

// Client-side image compression via HTML5 Canvas
function compressImage(
  file: File,
  maxWidth = 900,
  quality = 0.82
): Promise<{ dataUrl: string; originalKb: number; compressedKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not initialize compression canvas"));
          return;
        }

        // Draw image onto canvas with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const originalKb = Math.round(file.size / 1024);
        const compressedKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({ dataUrl, originalKb, compressedKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function SlipperImagePicker({ value, artNo, onChange }: SlipperImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [savingsInfo, setSavingsInfo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setErrorMessage("");
    setUploading(true);

    try {
      setStatusMessage("Compressing image...");
      const { dataUrl, originalKb, compressedKb } = await compressImage(file, 900, 0.82);

      const percentSaved = Math.max(0, Math.round(((originalKb - compressedKb) / originalKb) * 100));
      setSavingsInfo(`${originalKb}KB → ${compressedKb}KB (${percentSaved}% smaller)`);

      setStatusMessage("Uploading to Cloudinary CDN...");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          artNo: artNo || "SLIPPER",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image to Cloudinary");
      }

      // Pass the secure Cloudinary HTTPS URL back to the parent form (stored in MongoDB)
      onChange(data.url);
      setStatusMessage("");
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setErrorMessage((err as Error).message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: "none" }}
      />

      {errorMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 8px",
            background: "#ffe4e6",
            border: "1px solid #fecdd3",
            borderRadius: "4px",
            color: "#be123c",
            fontSize: "0.72rem",
          }}
        >
          <AlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}

      {uploading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Loader2 size={16} className="animate-spin" style={{ color: "#059669" }} />
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534" }}>
              {statusMessage}
            </span>
            {savingsInfo && (
              <span style={{ fontSize: "0.68rem", color: "#15803d" }}>
                Auto-compressed: {savingsInfo}
              </span>
            )}
          </div>
        </div>
      ) : value ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 10px",
            background: "#f8fafc",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <div
              style={{
                width: "42px",
                height: "32px",
                borderRadius: "3px",
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Cloudinary Slipper"
                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={13} style={{ color: "#059669" }} />
                <span style={{ fontSize: "0.74rem", color: "#059669", fontWeight: 700 }}>
                  Uploaded to Cloudinary CDN
                </span>
              </div>
              {savingsInfo && (
                <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
                  Size: {savingsInfo}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              style={{ padding: "2px 8px", fontSize: "0.72rem" }}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSavingsInfo("");
              }}
              className="btn btn-danger btn-sm"
              style={{ padding: "2px 6px" }}
              title="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "1px dashed var(--border-light)",
            borderRadius: "var(--radius-sm)",
            padding: "9px 12px",
            textAlign: "center",
            cursor: "pointer",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
        >
          <UploadCloud size={16} style={{ color: "#0284c7" }} />
          <span style={{ fontSize: "0.76rem", color: "#0f172a", fontWeight: 600, whiteSpace: "nowrap" }}>
            Upload Slipper Photo (PNG/JPG)
          </span>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            — Auto-compressed & stored in Cloudinary
          </span>
        </div>
      )}
    </div>
  );
}
