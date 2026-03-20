/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Loader2, Zap, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];
type Garment = Database["public"]["Tables"]["garments"]["Row"];

interface ArtDirectorSuggestions {
  prenda_principal: string;
  conjuntos_accesorios_recomendados: string[];
  lugares_recomendados: string[];
  poses_recomendadas: string[];
  iluminacion_recomendada: string[];
}

export interface SessionConfig {
  accessory_set?: string;
  location?: string;
  pose?: string;
  lighting?: string;
  garment_description?: string;
  image_model?: string;
}

interface SessionConfiguratorProps {
  garment: Garment;
  model: FashionModel;
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
  onGenerate: () => void;
  onBack: () => void;
}

type ImageModel = "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";

export function SessionConfigurator({
  garment,
  model,
  config,
  onConfigChange,
  onGenerate,
  onBack,
}: SessionConfiguratorProps) {
  const [suggestions, setSuggestions] = useState<ArtDirectorSuggestions | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ImageModel>("gemini-2.5-flash-image");

  // Auto-analyze garment on mount
  useEffect(() => {
    if (!suggestions && !analyzing) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/garments/${garment.id}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to analyze garment");
        return;
      }
      setSuggestions(data);
      // Auto-select first options
      onConfigChange({
        ...config,
        garment_description: data.prenda_principal,
        accessory_set: data.conjuntos_accesorios_recomendados[0],
        location: data.lugares_recomendados[0],
        pose: data.poses_recomendadas[0],
        lighting: data.iluminacion_recomendada[0],
        image_model: selectedModel,
      });
    } catch {
      toast.error("Failed to analyze garment");
    } finally {
      setAnalyzing(false);
    }
  }

  function select(key: keyof SessionConfig, value: string) {
    onConfigChange({ ...config, [key]: value });
  }

  function handleModelChange(m: ImageModel) {
    setSelectedModel(m);
    onConfigChange({ ...config, image_model: m });
  }

  if (analyzing) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#BEFF00]/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#BEFF00] animate-pulse" />
          </div>
        </div>
        <p className="text-[14px] text-[#A1A1AA]">Art Director is analyzing your garment...</p>
        <p className="text-[12px] text-[#52525B]">Suggesting accessories, locations, poses & lighting</p>
      </div>
    );
  }

  if (!suggestions) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[14px] text-[#71717A]">Could not analyze garment</p>
        <button
          onClick={handleAnalyze}
          className="h-[40px] rounded-[10px] bg-[#BEFF00] px-[18px] text-[14px] font-semibold text-[#09090B]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-7">
      {/* Suggestions Column */}
      <div className="flex-1 flex flex-col gap-5 lg:max-h-[600px] overflow-y-auto lg:pr-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-[16px] sm:text-[18px] font-bold text-[#FAFAFA]">
              Art Director Suggestions
            </h2>
            <p className="mt-1 text-[12px] text-[#52525B] line-clamp-2">
              {suggestions.prenda_principal}
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="h-[32px] rounded-[8px] border border-[#27272A] px-3 flex items-center gap-1.5 text-[12px] text-[#71717A] hover:bg-[#27272A] transition-colors self-start shrink-0"
          >
            <RefreshCw size={12} />
            Re-analyze
          </button>
        </div>

        {/* Accessories */}
        <SuggestionGroup
          title="Accessories & Styling"
          options={suggestions.conjuntos_accesorios_recomendados}
          selected={config.accessory_set}
          onSelect={(v) => select("accessory_set", v)}
        />

        {/* Locations */}
        <SuggestionGroup
          title="Location"
          options={suggestions.lugares_recomendados}
          selected={config.location}
          onSelect={(v) => select("location", v)}
        />

        {/* Poses */}
        <SuggestionGroup
          title="Pose"
          options={suggestions.poses_recomendadas}
          selected={config.pose}
          onSelect={(v) => select("pose", v)}
        />

        {/* Lighting */}
        <SuggestionGroup
          title="Lighting"
          options={suggestions.iluminacion_recomendada}
          selected={config.lighting}
          onSelect={(v) => select("lighting", v)}
          highlightFirst
        />

        {/* Image Model Selector */}
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-medium text-[#A1A1AA]">AI Image Model</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleModelChange("gemini-2.5-flash-image")}
              className={`flex-1 h-[44px] rounded-[10px] border px-3 text-[12px] font-medium transition-all ${
                selectedModel === "gemini-2.5-flash-image"
                  ? "border-[#BEFF00] bg-[#BEFF00]/5 text-[#BEFF00]"
                  : "border-[#27272A] bg-[#18181B] text-[#71717A] hover:border-[#3f3f46]"
              }`}
            >
              <span className="block text-[13px] font-semibold">Flash Image</span>
              <span className="block text-[10px] opacity-70">Fast, good quality</span>
            </button>
            <button
              onClick={() => handleModelChange("gemini-3-pro-image-preview")}
              className={`flex-1 h-[44px] rounded-[10px] border px-3 text-[12px] font-medium transition-all ${
                selectedModel === "gemini-3-pro-image-preview"
                  ? "border-[#BEFF00] bg-[#BEFF00]/5 text-[#BEFF00]"
                  : "border-[#27272A] bg-[#18181B] text-[#71717A] hover:border-[#3f3f46]"
              }`}
            >
              <span className="block text-[13px] font-semibold">Pro Image</span>
              <span className="block text-[10px] opacity-70">Best quality, slower</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Column */}
      <div
        className="flex flex-col shrink-0 rounded-xl bg-[#18181B] border border-[#27272A] p-4 sm:p-5 gap-4 w-full lg:w-[280px]"
      >
        <h3 className="font-heading text-[14px] font-semibold text-[#FAFAFA]">
          Summary
        </h3>

        <div className="h-px bg-[#27272A]" />

        {/* Garment */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 overflow-hidden rounded-lg">
            {garment.image_url ? (
              <img src={garment.image_url} alt="Garment" className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-[#27272A]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#FAFAFA] line-clamp-2">
              {suggestions.prenda_principal.slice(0, 60)}...
            </p>
            <p className="text-[11px] text-[#71717A]">Garment</p>
          </div>
        </div>

        {/* Model */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 overflow-hidden rounded-full">
            {model.ref_face_url ? (
              <img src={model.ref_face_url} alt={model.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-[#27272A]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#FAFAFA] truncate">{model.name}</p>
            <p className="text-[11px] text-[#71717A]">
              {[model.gender, model.country].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="h-px bg-[#27272A]" />

        {/* Selected options preview */}
        <div className="flex flex-col gap-2 text-[11px]">
          <SummaryRow label="Accessories" value={config.accessory_set} />
          <SummaryRow label="Location" value={config.location} />
          <SummaryRow label="Pose" value={config.pose} />
          <SummaryRow label="Lighting" value={config.lighting} />
          <SummaryRow
            label="Model"
            value={
              selectedModel === "gemini-2.5-flash-image"
                ? "Flash Image"
                : "Pro Image"
            }
          />
        </div>

        <div className="flex-1" />
        <div className="h-px bg-[#27272A]" />

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[14px] font-semibold text-[#FAFAFA]">
            <Zap size={14} fill="#BEFF00" color="#BEFF00" />5 credits
          </span>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!config.accessory_set || !config.location || !config.pose || !config.lighting}
          className="flex items-center justify-center gap-1.5 h-[44px] rounded-[10px] bg-[#BEFF00] text-[14px] font-bold text-[#09090B] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap size={14} fill="#09090B" color="#09090B" />
          Generate Photo
        </button>
      </div>
    </div>
  );
}

function SuggestionGroup({
  title,
  options,
  selected,
  onSelect,
  highlightFirst,
}: {
  title: string;
  options: string[];
  selected?: string;
  onSelect: (v: string) => void;
  highlightFirst?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-medium text-[#A1A1AA]">{title}</p>
      <div className="flex flex-col gap-1.5">
        {options.map((option, i) => {
          const isSelected = selected === option;
          return (
            <button
              key={i}
              onClick={() => onSelect(option)}
              className={`w-full text-left rounded-[10px] border px-[14px] py-[10px] text-[13px] transition-all ${
                isSelected
                  ? "border-[#BEFF00] bg-[#BEFF00]/5 text-[#FAFAFA]"
                  : "border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:border-[#3f3f46]"
              }`}
            >
              {highlightFirst && i === 0 && (
                <span className="text-[#BEFF00] text-[10px] font-bold mr-2">BEST</span>
              )}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-[#52525B]">{label}: </span>
      <span className="text-[#A1A1AA]">{value ? value.slice(0, 50) + (value.length > 50 ? "..." : "") : "—"}</span>
    </div>
  );
}
