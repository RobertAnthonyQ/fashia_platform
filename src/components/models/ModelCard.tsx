"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];

interface ModelMetadata {
  height_cm?: number;
  bust_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  body_type?: string;
  skin_tone?: string;
  hair_color?: string;
  full_description?: string;
}

interface ModelCardProps {
  model: FashionModel;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onModelUpdated?: (model: FashionModel) => void;
  isPreset?: boolean;
}

export function ModelCard({
  model,
  onEdit,
  onDelete,
  onModelUpdated,
  isPreset,
}: ModelCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [generatingFace, setGeneratingFace] = useState(false);

  const metadata = model.metadata as ModelMetadata | null;

  async function handleGenerateFace(e: React.MouseEvent) {
    e.stopPropagation();
    setGeneratingFace(true);

    try {
      // Generate profile first if no metadata
      if (!metadata?.full_description) {
        const profileRes = await fetch(
          `/api/models/${model.id}/generate-profile`,
          { method: "POST" },
        );
        if (!profileRes.ok) {
          toast.error("Failed to generate profile");
          setGeneratingFace(false);
          return;
        }
      }

      const res = await fetch(`/api/models/${model.id}/generate-face`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error ?? "Failed to generate face");
      } else {
        toast.success("Portrait generated!");
        onModelUpdated?.(result);
      }
    } catch {
      toast.error("Failed to generate face");
    } finally {
      setGeneratingFace(false);
    }
  }

  return (
    <div
      className="relative h-[300px] flex flex-col overflow-hidden rounded-xl border border-[#27272A] bg-[#18181B]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Portrait area */}
      <div className="relative h-[200px] w-full shrink-0">
        {model.ref_face_url ? (
          <img
            src={model.ref_face_url}
            alt={model.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[#27272A] flex items-center justify-center">
            {generatingFace ? (
              <Loader2 className="w-8 h-8 text-[#BEFF00] animate-spin" />
            ) : !isPreset ? (
              <button
                onClick={handleGenerateFace}
                className="flex flex-col items-center gap-2 text-[#52525B] hover:text-[#BEFF00] transition-colors"
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-[11px] font-medium">Generate Face</span>
              </button>
            ) : (
              <span className="text-3xl text-[#52525B]">&#128100;</span>
            )}
          </div>
        )}

        {/* PRESET badge */}
        {isPreset && (
          <span className="absolute left-[10px] top-[10px] flex h-[22px] items-center rounded-md bg-[#BEFF00] px-2 text-[10px] font-bold text-[#09090B]">
            PRESET
          </span>
        )}

        {/* Hover overlay with edit/delete buttons (non-preset only) */}
        {!isPreset && isHovered && model.ref_face_url && (onEdit || onDelete) && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(model.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272A] text-[#FAFAFA] transition-colors hover:bg-[#3f3f46]"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(model.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272A] text-[#FAFAFA] transition-colors hover:bg-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="flex flex-1 flex-col gap-1.5 p-[14px]">
        <span className="truncate text-[14px] font-semibold text-[#FAFAFA]">
          {model.name}
        </span>

        <div className="flex flex-wrap gap-1.5">
          {model.gender && (
            <span className="flex h-[20px] items-center rounded-md bg-[#27272A] px-2 text-[10px] text-[#A1A1AA]">
              {model.gender}
            </span>
          )}
          {model.country && (
            <span className="flex h-[20px] items-center rounded-md bg-[#27272A] px-2 text-[10px] text-[#A1A1AA]">
              {model.country}
            </span>
          )}
          {metadata?.height_cm && (
            <span className="flex h-[20px] items-center rounded-md bg-[#27272A] px-2 text-[10px] text-[#A1A1AA]">
              {metadata.height_cm}cm
            </span>
          )}
          {metadata?.body_type && (
            <span className="flex h-[20px] items-center rounded-md bg-[#27272A] px-2 text-[10px] text-[#A1A1AA]">
              {metadata.body_type}
            </span>
          )}
        </div>

        {metadata?.bust_cm && metadata?.waist_cm && metadata?.hips_cm && (
          <p className="text-[11px] text-[#52525B]">
            {metadata.bust_cm}-{metadata.waist_cm}-{metadata.hips_cm}
          </p>
        )}
      </div>
    </div>
  );
}
