"use client";

import { useState, useCallback } from "react";
import { GalleryFilters } from "./GalleryFilters";
import { ImageGrid } from "./ImageGrid";
import { ImageDetailModal } from "./ImageDetailModal";
import type { Database } from "@/src/types/database";

type GeneratedOutput = Database["public"]["Tables"]["generated_outputs"]["Row"];

interface GalleryPageClientProps {
  initialOutputs: GeneratedOutput[];
  totalCount: number;
  models: Array<{ id: string; name: string }>;
}

const PAGE_SIZE = 20;

export function GalleryPageClient({
  initialOutputs,
  totalCount,
  models,
}: GalleryPageClientProps) {
  const [outputs, setOutputs] = useState<GeneratedOutput[]>(initialOutputs);
  const [filters, setFilters] = useState<{
    favorite?: boolean;
    model_id?: string;
    garment_id?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(totalCount);
  const [selectedOutput, setSelectedOutput] = useState<GeneratedOutput | null>(
    null,
  );

  const fetchOutputs = useCallback(
    async (
      newFilters: typeof filters,
      pageNum: number,
      append: boolean = false,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(PAGE_SIZE));
        if (newFilters.favorite) params.set("favorite", "true");
        if (newFilters.model_id) params.set("model_id", newFilters.model_id);
        if (newFilters.garment_id)
          params.set("garment_id", newFilters.garment_id);

        const res = await fetch(`/api/gallery?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();

        if (append) {
          setOutputs((prev) => [...prev, ...(data.outputs ?? [])]);
        } else {
          setOutputs(data.outputs ?? []);
        }
        setTotal(data.totalCount ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleFilterChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters);
      setPage(1);
      fetchOutputs(newFilters, 1);
    },
    [fetchOutputs],
  );

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchOutputs(filters, nextPage, true);
  }, [page, filters, fetchOutputs]);

  const handleFavorite = useCallback(async (id: string, current: boolean) => {
    setOutputs((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_favorite: !current } : o)),
    );

    try {
      const res = await fetch(`/api/gallery/${id}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !current }),
      });
      if (!res.ok) {
        setOutputs((prev) =>
          prev.map((o) => (o.id === id ? { ...o, is_favorite: current } : o)),
        );
      }
    } catch {
      setOutputs((prev) =>
        prev.map((o) => (o.id === id ? { ...o, is_favorite: current } : o)),
      );
    }
  }, []);

  const hasMore = outputs.length < total;

  return (
    <div className="flex flex-col gap-5 px-4 py-6 sm:px-9 sm:py-8 min-h-full">
      <GalleryFilters
        models={models}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <ImageGrid
        outputs={outputs}
        onFavorite={handleFavorite}
        onSelect={setSelectedOutput}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />

      {selectedOutput && (
        <ImageDetailModal
          output={selectedOutput}
          onClose={() => setSelectedOutput(null)}
          onFavorite={(id, current) => handleFavorite(id, current)}
        />
      )}
    </div>
  );
}
