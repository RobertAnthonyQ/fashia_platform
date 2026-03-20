"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, User, ArrowLeft, Users, Search } from "lucide-react";
import { EmptyState } from "@/src/components/shared/EmptyState";
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];

interface ModelMetadata {
  height_cm?: number;
  body_type?: string;
  skin_tone?: string;
  hair_color?: string;
  bust_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
}

interface ModelSelectorProps {
  models: FashionModel[];
  selected: FashionModel | null;
  onSelect: (model: FashionModel) => void;
  onBack: () => void;
}

export function ModelSelector({
  models,
  selected,
  onSelect,
  onBack,
}: ModelSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.gender ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.country ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (models.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="text-zinc-400">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <EmptyState
          icon={Users}
          title="No models available"
          description="Create a model first in the Models page"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="text-zinc-400 self-start">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-zinc-400 hidden sm:block">
          Select the model for your photoshoot
        </p>
      </div>

      {/* Search bar */}
      {models.length > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models by name, gender or country..."
            className="w-full h-[40px] rounded-[10px] bg-[#09090B] border border-[#27272A] pl-9 pr-4 text-[13px] text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#BEFF00]/50 transition-colors"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((model) => {
          const isSelected = selected?.id === model.id;
          const meta = model.metadata as ModelMetadata | null;
          return (
            <button
              key={model.id}
              onClick={() => onSelect(model)}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-zinc-900 p-0 text-left transition-all",
                isSelected
                  ? "border-[#BEFF00] ring-2 ring-[#BEFF00]/30"
                  : "border-zinc-800 hover:border-zinc-600",
              )}
            >
              {/* Portrait */}
              <div className="aspect-[3/4] overflow-hidden bg-zinc-800">
                {model.ref_face_url ? (
                  <img
                    src={model.ref_face_url}
                    alt={model.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <User className="h-10 w-10 text-zinc-600" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-10 h-10 rounded-full bg-[#BEFF00] flex items-center justify-center">
                      <Check className="h-5 w-5 text-[#09090B]" />
                    </div>
                  </div>
                )}
                {/* Preset badge */}
                {model.is_preset && (
                  <span className="absolute left-2 top-2 flex h-[20px] items-center rounded-md bg-[#BEFF00] px-1.5 text-[9px] font-bold text-[#09090B]">
                    PRESET
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5 sm:p-3 space-y-1.5">
                <p className="truncate text-sm font-semibold text-zinc-200">
                  {model.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {model.gender && (
                    <span className="flex h-[18px] items-center rounded bg-[#27272A] px-1.5 text-[10px] text-[#A1A1AA]">
                      {model.gender}
                    </span>
                  )}
                  {model.country && (
                    <span className="flex h-[18px] items-center rounded bg-[#27272A] px-1.5 text-[10px] text-[#A1A1AA]">
                      {model.country}
                    </span>
                  )}
                  {meta?.height_cm && (
                    <span className="flex h-[18px] items-center rounded bg-[#27272A] px-1.5 text-[10px] text-[#A1A1AA]">
                      {meta.height_cm}cm
                    </span>
                  )}
                </div>
                {meta?.body_type && (
                  <p className="text-[11px] text-[#52525B] truncate">
                    {meta.body_type}
                    {meta.bust_cm && meta.waist_cm && meta.hips_cm
                      ? ` · ${meta.bust_cm}-${meta.waist_cm}-${meta.hips_cm}`
                      : ""}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && search && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-[14px] text-[#71717A]">No models match &quot;{search}&quot;</p>
          <button
            onClick={() => setSearch("")}
            className="text-[13px] text-[#BEFF00] hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
