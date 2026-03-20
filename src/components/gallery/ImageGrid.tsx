"use client";

import { useState } from "react";
/* eslint-disable @next/next/no-img-element */
import { Heart, Download } from "lucide-react";
import type { Database } from "@/src/types/database";

type GeneratedOutput = Database["public"]["Tables"]["generated_outputs"]["Row"];

interface ImageGridProps {
  outputs: GeneratedOutput[];
  onFavorite: (id: string, current: boolean) => void;
  onSelect: (output: GeneratedOutput) => void;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function ImageCard({
  output,
  onFavorite,
  onSelect,
}: {
  output: GeneratedOutput;
  onFavorite: (id: string, current: boolean) => void;
  onSelect: (output: GeneratedOutput) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-[10px] overflow-hidden cursor-pointer break-inside-avoid mb-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(output)}
    >
      {output.image_url ? (
        <img
          src={output.image_url}
          alt=""
          className="w-full h-auto block rounded-[10px]"
        />
      ) : (
        <div className="w-full aspect-[9/16] bg-[#18181B] flex items-center justify-center rounded-[10px]">
          <span className="text-[12px] text-[#52525B]">No image</span>
        </div>
      )}

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent transition-opacity duration-200 rounded-[10px] ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(output.id, output.is_favorite ?? false);
            }}
            className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
              output.is_favorite
                ? "bg-[#BEFF00]/20 text-[#BEFF00]"
                : "bg-black/40 text-white/70 hover:text-white"
            }`}
          >
            <Heart
              className="w-3.5 h-3.5"
              fill={output.is_favorite ? "#BEFF00" : "none"}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (output.image_url) {
                const a = document.createElement("a");
                a.href = output.image_url;
                a.download = `fashia-${output.id}.png`;
                a.click();
              }
            }}
            className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ImageGrid({
  outputs,
  onFavorite,
  onSelect,
  loading,
  hasMore,
  onLoadMore,
}: ImageGridProps) {
  if (loading && outputs.length === 0) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[10px] bg-[#18181B] animate-pulse mb-3 break-inside-avoid aspect-[9/16]"
          />
        ))}
      </div>
    );
  }

  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#18181B] flex items-center justify-center">
          <span className="text-[#52525B] text-xl">🖼</span>
        </div>
        <p className="text-[14px] text-[#71717A]">No images generated yet</p>
        <p className="text-[12px] text-[#52525B]">
          Head to the Studio to create your first generation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
        {outputs.map((output) => (
          <ImageCard
            key={output.id}
            output={output}
            onFavorite={onFavorite}
            onSelect={onSelect}
          />
        ))}
      </div>

      {loading && (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[10px] bg-[#18181B] animate-pulse mb-3 break-inside-avoid aspect-[9/16]"
            />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            className="h-[34px] px-5 rounded-lg bg-[#18181B] border border-[#27272A] text-[12px] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3f3f46] transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
