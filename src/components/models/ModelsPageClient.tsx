"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search } from "lucide-react";
import type { Database } from "@/src/types/database";
import { ModelGrid } from "./ModelGrid";
import { CreateModelModal } from "./CreateModelModal";
import { EditModelModal } from "./EditModelModal";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];

interface ModelsPageClientProps {
  userModels: FashionModel[];
  presetModels: FashionModel[];
}

type GenderFilter = "all" | "female" | "male" | "non_binary";
type SourceFilter = "all" | "mine" | "preset";

export function ModelsPageClient({
  userModels,
  presetModels,
}: ModelsPageClientProps) {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<FashionModel | null>(null);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const presetIds = useMemo(() => presetModels.map((m) => m.id), [presetModels]);

  const filteredModels = useMemo(() => {
    let models: FashionModel[];

    if (sourceFilter === "mine") {
      models = [...userModels];
    } else if (sourceFilter === "preset") {
      models = [...presetModels];
    } else {
      models = [...userModels, ...presetModels];
    }

    if (genderFilter !== "all") {
      models = models.filter((m) => m.gender === genderFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      models = models.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.country?.toLowerCase().includes(q) ?? false) ||
          (m.style?.toLowerCase().includes(q) ?? false),
      );
    }

    return models;
  }, [userModels, presetModels, genderFilter, sourceFilter, searchQuery]);

  const filterBtnClass = (active: boolean) =>
    `h-[32px] rounded-[8px] px-3 text-[12px] font-medium transition-colors ${
      active
        ? "bg-[#BEFF00] text-[#09090B]"
        : "bg-[#27272A] text-[#71717A] hover:text-[#A1A1AA]"
    }`;

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-[300px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className="w-full h-[36px] rounded-[10px] bg-[#18181B] border border-[#27272A] pl-9 pr-3 text-[13px] text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#BEFF00]/50 transition-colors"
          />
        </div>

        {/* Gender filter */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setGenderFilter("all")}
            className={filterBtnClass(genderFilter === "all")}
          >
            All
          </button>
          <button
            onClick={() => setGenderFilter("female")}
            className={filterBtnClass(genderFilter === "female")}
          >
            Female
          </button>
          <button
            onClick={() => setGenderFilter("male")}
            className={filterBtnClass(genderFilter === "male")}
          >
            Male
          </button>
          <button
            onClick={() => setGenderFilter("non_binary")}
            className={filterBtnClass(genderFilter === "non_binary")}
          >
            Non-binary
          </button>
        </div>

        {/* Source filter */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setSourceFilter("all")}
            className={filterBtnClass(sourceFilter === "all")}
          >
            All
          </button>
          <button
            onClick={() => setSourceFilter("mine")}
            className={filterBtnClass(sourceFilter === "mine")}
          >
            My Models
          </button>
          <button
            onClick={() => setSourceFilter("preset")}
            className={filterBtnClass(sourceFilter === "preset")}
          >
            Presets
          </button>
        </div>
      </div>

      {/* Model Grid */}
      <ModelGrid
        models={filteredModels}
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
