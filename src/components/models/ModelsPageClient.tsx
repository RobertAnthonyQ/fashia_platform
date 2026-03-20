"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";
import { ModelGrid } from "./ModelGrid";
import { CreateModelModal } from "./CreateModelModal";
import { EditModelModal } from "./EditModelModal";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];

interface ModelsPageClientProps {
  userModels: FashionModel[];
  presetModels: FashionModel[];
}

export function ModelsPageClient({
  userModels,
  presetModels,
}: ModelsPageClientProps) {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<FashionModel | null>(null);

  const handleCreateSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleEdit = useCallback(
    (id: string) => {
      const model = userModels.find((m) => m.id === id);
      if (model) setEditingModel(model);
    },
    [userModels],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/models/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Model deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete model");
      }
    },
    [router],
  );

  const handleModelUpdated = useCallback(() => {
    router.refresh();
  }, [router]);

  const allModels: FashionModel[] = [...userModels, ...presetModels];
  const presetIds = presetModels.map((m) => m.id);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 px-4 py-6 sm:px-9 sm:py-8 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 sm:h-[44px]">
        <h1 className="font-heading text-[20px] sm:text-[22px] font-bold text-[#FAFAFA]">
          Fashion Models
        </h1>
        <div className="flex-1" />
        <button
          onClick={() => setCreateModalOpen(true)}
          className="h-[36px] sm:h-[40px] rounded-[10px] bg-[#BEFF00] px-3 sm:px-[18px] flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition-opacity shrink-0"
        >
          <span className="text-[14px] sm:text-[16px] font-bold text-[#09090B]">+</span>
          <span className="text-[13px] sm:text-[14px] font-semibold text-[#09090B]">
            Create Model
          </span>
        </button>
      </div>

      {/* Model Grid */}
      <ModelGrid
        models={allModels}
        presetModelIds={presetIds}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onModelUpdated={handleModelUpdated}
      />

      {/* Create Modal */}
      <CreateModelModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      {editingModel && (
        <EditModelModal
          open={!!editingModel}
          onOpenChange={(open) => {
            if (!open) setEditingModel(null);
          }}
          model={editingModel}
          onSuccess={() => {
            setEditingModel(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
