"use client";

import { useState, useRef, useEffect } from "react";
import { Star } from "lucide-react";

interface GalleryFiltersProps {
  models: Array<{ id: string; name: string }>;
  filters: { favorite?: boolean; model_id?: string; garment_id?: string };
  onFilterChange: (filters: {
    favorite?: boolean;
    model_id?: string;
    garment_id?: string;
  }) => void;
}

type TabKey = "all" | "favorites" | "photos" | "videos";

interface DropdownProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

function FilterDropdown({ label, value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "All";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-[#3f3f46] transition-colors"
      >
        <span className="text-[12px] text-[#A1A1AA]">{label}:</span>
        <span className="text-[12px] text-[#A1A1AA]">{selectedLabel}</span>
        <span className="text-[11px] text-[#52525B] ml-0.5">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg bg-[#18181B] border border-[#27272A] shadow-xl py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
                value === option.value
                  ? "text-[#BEFF00] bg-[#BEFF00]/5"
                  : "text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GalleryFilters({
  models,
  filters,
  onFilterChange,
}: GalleryFiltersProps) {
  const activeTab: TabKey = filters.favorite ? "favorites" : "all";

  function handleTabChange(tab: TabKey) {
    if (tab === "favorites") {
      onFilterChange({ ...filters, favorite: true });
    } else {
      onFilterChange({ ...filters, favorite: undefined });
    }
  }

  const tabs: Array<{ key: TabKey; label: string; icon?: React.ReactNode }> = [
    { key: "all", label: "All" },
    {
      key: "favorites",
      label: "Favorites",
      icon: <Star className="w-3 h-3" />,
    },
    { key: "photos", label: "Photos" },
    { key: "videos", label: "Videos" },
  ];

  const modelOptions = [
    { value: "", label: "All" },
    ...models.map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header row: Title + Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:h-[44px]">
        <h1 className="font-heading text-[22px] font-bold text-[#FAFAFA]">
          Gallery
        </h1>
        <div className="flex-1" />
        <div className="flex items-center gap-2.5">
          <FilterDropdown
            label="Model"
            value={filters.model_id ?? ""}
            options={modelOptions}
            onChange={(v) =>
              onFilterChange({ ...filters, model_id: v || undefined })
            }
          />
          <FilterDropdown
            label="Garment"
            value={filters.garment_id ?? ""}
            options={[{ value: "", label: "All" }]}
            onChange={(v) =>
              onFilterChange({ ...filters, garment_id: v || undefined })
            }
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center h-[36px] gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 h-[32px] px-3.5 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-[#BEFF00]/[0.08] border border-[#BEFF00]/25 text-[#BEFF00]"
                  : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#18181B]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
