"use client";

import { ModelCard } from "./ModelCard";
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];

interface ModelGridProps {
  models: FashionModel[];
  presetModelIds?: string[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onModelUpdated?: (model: FashionModel) => void;
}

export function ModelGrid({
  models,
  presetModelIds = [],
  onEdit,
  onDelete,
  onModelUpdated,
}: ModelGridProps) {
  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#18181B] flex items-center justify-center">
          <span className="text-[#52525B] text-xl">&#128100;</span>
        </div>
        <p className="text-[14px] text-[#71717A]">No models yet</p>
        <p className="text-[12px] text-[#52525B]">
          Create your first model to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          onEdit={onEdit}
          onDelete={onDelete}
          onModelUpdated={onModelUpdated}
          isPreset={
            presetModelIds.includes(model.id) || (model.is_preset ?? false)
          }
        />
      ))}
    </div>
  );
}
