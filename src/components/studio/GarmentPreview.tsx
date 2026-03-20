"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Shirt, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";

type Garment = Database["public"]["Tables"]["garments"]["Row"];

interface GarmentPreviewProps {
  garments: Garment[];
  selected: Garment | null;
  onSelect: (garment: Garment) => void;
  onDelete?: (garmentId: string) => void;
}

export function GarmentPreview({
  garments,
  selected,
  onSelect,
  onDelete,
}: GarmentPreviewProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  async function handleDelete(e: React.MouseEvent, garment: Garment) {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(garment.id);
    try {
      const res = await fetch(`/api/garments/${garment.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Garment deleted");
        onDelete?.(garment.id);
      } else {
        toast.error("Failed to delete garment");
      }
    } catch {
      toast.error("Failed to delete garment");
    } finally {
      setDeletingId(null);
    }
  }

  if (garments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-10">
        <Shirt className="mb-3 h-10 w-10 text-zinc-600" />
        <p className="text-sm text-zinc-400">
          No garments yet. Upload your first one!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-300">
        Or select an existing garment
      </p>
      <div className="grid max-h-[400px] grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        {garments.map((garment) => {
          const isSelected = selected?.id === garment.id;
          const isDeleting = deletingId === garment.id;
          const imageFailed = failedImages.has(garment.id);
          return (
            <button
              key={garment.id}
              onClick={() => onSelect(garment)}
              disabled={isDeleting}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border transition-all",
                isSelected
                  ? "border-[#BEFF00] ring-1 ring-[#BEFF00]"
                  : "border-zinc-700 hover:border-zinc-500",
                isDeleting && "pointer-events-none opacity-50",
              )}
            >
              {imageFailed ? (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                  <Shirt className="h-8 w-8 text-zinc-600" />
                </div>
              ) : (
                <img
                  src={garment.image_url}
                  alt={garment.description ?? "Garment"}
                  className="h-full w-full object-cover"
                  onError={() =>
                    setFailedImages((prev) => new Set(prev).add(garment.id))
                  }
                />
              )}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Check className="h-6 w-6 text-[#BEFF00]" />
                </div>
              )}
              {/* Delete button */}
              <div
                onClick={(e) => handleDelete(e, garment)}
                className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                ) : (
                  <Trash2 className="h-3 w-3 text-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
