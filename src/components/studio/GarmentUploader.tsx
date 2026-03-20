"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";

type Garment = Database["public"]["Tables"]["garments"]["Row"];

interface GarmentUploaderProps {
  onUploaded: (garment: Garment) => void;
}

export function GarmentUploader({ onUploaded }: GarmentUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be smaller than 10MB");
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/garments", {
        method: "POST",
        body: formData,
      });

      setUploading(false);
      if (res.ok) {
        const garment = await res.json();
        toast.success("Garment uploaded");
        onUploaded(garment);
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Upload failed");
      }
    },
    [onUploaded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
        isDragActive
          ? "border-[#BEFF00] bg-[#BEFF00]/5"
          : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
      }`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <>
          <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#BEFF00]" />
          <p className="text-sm text-zinc-300">Uploading garment...</p>
        </>
      ) : (
        <>
          <div className="mb-3 rounded-full bg-zinc-800 p-3">
            {isDragActive ? (
              <ImageIcon className="h-8 w-8 text-[#BEFF00]" />
            ) : (
              <Upload className="h-8 w-8 text-zinc-400" />
            )}
          </div>
          <p className="text-sm font-medium text-zinc-200">
            {isDragActive ? "Drop your garment here" : "Upload a garment image"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            PNG, JPG, WebP — max 10MB
          </p>
        </>
      )}
    </div>
  );
}
