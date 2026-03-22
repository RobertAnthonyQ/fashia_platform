/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Zap, RefreshCw, Sparkles, Plus, X, Check } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];
type Garment = Database["public"]["Tables"]["garments"]["Row"];

interface SuggestionItem {
  label: string;
  detail: string;
}

interface ArtDirectorSuggestions {
  prenda_principal: string;
  target: string;
  incluye_calzado: boolean;
  calzado: SuggestionItem[];
  accesorios: SuggestionItem[];
  complementos: SuggestionItem[];
  locacion: SuggestionItem[];
  pose: SuggestionItem[];
  iluminacion: SuggestionItem[];
}

export interface SessionConfig {
  calzado?: string[];
  accesorios?: string[];
  complementos?: string[];
  location?: string;
  pose?: string;
  lighting?: string;
  garment_description?: string;
  image_model?: string;
  custom_calzado?: string;
  custom_accesorios?: string;
  custom_complementos?: string;
  custom_location?: string;
  custom_pose?: string;
  custom_lighting?: string;
  custom_prompt?: string;
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

const CREDITS: Record<ImageModel, number> = {
  "gemini-2.5-flash-image": 5,
  "gemini-3-pro-image-preview": 10,
};

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

  const credits = CREDITS[selectedModel];

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_gender: model.gender }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to analyze garment");
        return;
      }
      setSuggestions(data);
      const autoCalzado = data.incluye_calzado && data.calzado?.[0] ? [data.calzado[0].detail] : [];
      const autoAccesorios = data.accesorios?.slice(0, 2).map((a: SuggestionItem) => a.detail) ?? [];
      onConfigChange({
        ...config,
        garment_description: data.prenda_principal,
        calzado: autoCalzado,
        accesorios: autoAccesorios,
        complementos: [],
        location: data.locacion?.[0]?.detail,
        pose: data.pose?.[0]?.detail,
        lighting: data.iluminacion?.[0]?.detail,
        image_model: selectedModel,
      });
    } catch {
      toast.error("Failed to analyze garment");
    } finally {
      setAnalyzing(false);
    }
  }

  function toggleCheckbox(key: "calzado" | "accesorios" | "complementos", detail: string) {
    const current = config[key] ?? [];
    const updated = current.includes(detail)
      ? current.filter((v) => v !== detail)
      : [...current, detail];
    onConfigChange({ ...config, [key]: updated });
  }

  function selectRadio(key: "location" | "pose" | "lighting", detail: string) {
    onConfigChange({ ...config, [key]: detail });
  }

  function setCustom(key: keyof SessionConfig, value: string) {
    onConfigChange({ ...config, [key]: value });
  }

  function handleModelChange(m: ImageModel) {
    setSelectedModel(m);
    onConfigChange({ ...config, image_model: m });
  }

  const hasLocation = !!config.location || !!config.custom_location;
  const hasPose = !!config.pose || !!config.custom_pose;
  const hasLighting = !!config.lighting || !!config.custom_lighting;
  const canGenerate = hasLocation && hasPose && hasLighting;

  if (analyzing) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#BEFF00]/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-[#BEFF00] animate-pulse" />
        </div>
        <p className="text-[16px] text-[#A1A1AA] font-medium">Analizando tu prenda...</p>
        <p className="text-[13px] text-[#52525B]">Adaptando sugerencias para {model.gender ?? "modelo"}</p>
      </div>
    );
  }

  if (!suggestions) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <p className="text-[16px] text-[#71717A]">No se pudo analizar la prenda</p>
        <button onClick={handleAnalyze} className="h-[44px] rounded-[10px] bg-[#BEFF00] px-6 text-[14px] font-semibold text-[#09090B]">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* ── Main Column ── */}
      <div className="flex-1 flex flex-col gap-8 lg:max-h-[750px] overflow-y-auto lg:pr-4 scrollbar-thin">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-[22px] font-bold text-[#FAFAFA]">Configurar sesion</h2>
            <p className="mt-1.5 text-[14px] text-[#71717A] leading-relaxed line-clamp-2">{suggestions.prenda_principal}</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="h-[36px] rounded-[8px] border border-[#27272A] px-4 flex items-center gap-2 text-[13px] text-[#71717A] hover:bg-[#18181B] transition-colors self-start shrink-0"
          >
            <RefreshCw size={14} />
            Re-analizar
          </button>
        </div>

        {/* ── STYLING GRID (2 columns, collapsible) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.incluye_calzado && suggestions.calzado.length > 0 && (
            <Accordion
              title="Calzado"
              badge={config.calzado?.length || undefined}
            >
              <div className="flex flex-col gap-1.5">
                {suggestions.calzado.map((item, i) => (
                  <CheckItem
                    key={i}
                    label={item.label}
                    checked={config.calzado?.includes(item.detail) ?? false}
                    onChange={() => toggleCheckbox("calzado", item.detail)}
                  />
                ))}
              </div>
              <CustomInput
                value={config.custom_calzado}
                onChange={(v) => setCustom("custom_calzado", v)}
                placeholder="Agregar calzado..."
              />
            </Accordion>
          )}

          <Accordion
            title="Accesorios"
            badge={config.accesorios?.length || undefined}
          >
            <div className="flex flex-col gap-1.5">
              {suggestions.accesorios.map((item, i) => (
                <CheckItem
                  key={i}
                  label={item.label}
                  checked={config.accesorios?.includes(item.detail) ?? false}
                  onChange={() => toggleCheckbox("accesorios", item.detail)}
                />
              ))}
            </div>
            <CustomInput
              value={config.custom_accesorios}
              onChange={(v) => setCustom("custom_accesorios", v)}
              placeholder="Agregar accesorio..."
            />
          </Accordion>

          {suggestions.complementos.length > 0 && (
            <Accordion
              title="Complementos"
              badge={config.complementos?.length || undefined}
            >
              <div className="flex flex-col gap-1.5">
                {suggestions.complementos.map((item, i) => (
                  <CheckItem
                    key={i}
                    label={item.label}
                    checked={config.complementos?.includes(item.detail) ?? false}
                    onChange={() => toggleCheckbox("complementos", item.detail)}
                  />
                ))}
              </div>
              <CustomInput
                value={config.custom_complementos}
                onChange={(v) => setCustom("custom_complementos", v)}
                placeholder="Agregar complemento..."
              />
            </Accordion>
          )}

          <Accordion
            title="Locacion"
            badge={config.location ? 1 : undefined}
          >
            <div className="flex flex-col gap-1.5">
              {suggestions.locacion.map((item, i) => (
                <RadioItem
                  key={i}
                  label={item.label}
                  selected={config.location === item.detail}
                  onSelect={() => selectRadio("location", item.detail)}
                />
              ))}
            </div>
            <CustomInput
              value={config.custom_location}
              onChange={(v) => setCustom("custom_location", v)}
              placeholder="Locacion personalizada..."
            />
          </Accordion>
        </div>

        {/* ── POSE & LIGHTING (2 columns, collapsible) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Accordion
            title="Pose"
            badge={config.pose ? 1 : undefined}
          >
            <div className="flex flex-col gap-1.5">
              {suggestions.pose.map((item, i) => (
                <RadioItem
                  key={i}
                  label={item.label}
                  selected={config.pose === item.detail}
                  onSelect={() => selectRadio("pose", item.detail)}
                />
              ))}
            </div>
            <CustomInput
              value={config.custom_pose}
              onChange={(v) => setCustom("custom_pose", v)}
              placeholder="Pose personalizada..."
            />
          </Accordion>

          <Accordion
            title="Iluminacion"
            badge={config.lighting ? 1 : undefined}
          >
            <div className="flex flex-col gap-1.5">
              {suggestions.iluminacion.map((item, i) => (
                <RadioItem
                  key={i}
                  label={item.label}
                  selected={config.lighting === item.detail}
                  onSelect={() => selectRadio("lighting", item.detail)}
                  badge={i === 0 ? "BEST" : undefined}
                />
              ))}
            </div>
            <CustomInput
              value={config.custom_lighting}
              onChange={(v) => setCustom("custom_lighting", v)}
              placeholder="Iluminacion personalizada..."
            />
          </Accordion>
        </div>

        {/* ── INSTRUCCIONES ADICIONALES ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-semibold text-[#FAFAFA]">Instrucciones adicionales</h3>
            <span className="text-[12px] text-[#52525B]">opcional</span>
          </div>
          <textarea
            value={config.custom_prompt ?? ""}
            onChange={(e) => setCustom("custom_prompt", e.target.value)}
            placeholder="Ej: que mire hacia la derecha, expresion seria, fondo con tonos calidos..."
            rows={2}
            className="w-full rounded-[10px] border border-[#1e1e21] bg-[#09090B] px-4 py-3 text-[14px] leading-relaxed text-[#FAFAFA] placeholder:text-[#3f3f46] focus:border-[#BEFF00]/50 focus:outline-none resize-none transition-colors"
          />
        </div>

        {/* ── MODELO DE IA ── */}
        <div className="grid grid-cols-2 gap-3">
          <ModelCard
            name="Flash Image"
            description="Rapido, buena calidad"
            cost={5}
            selected={selectedModel === "gemini-2.5-flash-image"}
            onSelect={() => handleModelChange("gemini-2.5-flash-image")}
          />
          <ModelCard
            name="Pro Image"
            description="Mejor calidad, mas lento"
            cost={10}
            selected={selectedModel === "gemini-3-pro-image-preview"}
            onSelect={() => handleModelChange("gemini-3-pro-image-preview")}
          />
        </div>
      </div>

      {/* ── Summary Sidebar ── */}
      <div className="flex flex-col shrink-0 rounded-[14px] bg-[#111113] border border-[#1e1e21] p-5 gap-5 w-full lg:w-[300px] lg:sticky lg:top-6 lg:self-start">
        <h3 className="font-heading text-[17px] font-semibold text-[#FAFAFA]">Resumen</h3>

        <div className="h-px bg-[#1e1e21]" />

        {/* Garment */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-14 h-14 overflow-hidden rounded-[10px] border border-[#1e1e21]">
            {garment.image_url ? (
              <img src={garment.image_url} alt="Garment" className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-[#1e1e21]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#FAFAFA] line-clamp-2 leading-snug">
              {suggestions.prenda_principal.slice(0, 70)}...
            </p>
            <p className="text-[11px] text-[#52525B] mt-1">Prenda</p>
          </div>
        </div>

        {/* Model */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-11 h-11 overflow-hidden rounded-full border border-[#1e1e21]">
            {model.ref_face_url ? (
              <img src={model.ref_face_url} alt={model.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-[#1e1e21]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-[#FAFAFA] truncate">{model.name}</p>
            <p className="text-[11px] text-[#52525B]">{[model.gender, model.country].filter(Boolean).join(" · ")}</p>
          </div>
        </div>

        <div className="h-px bg-[#1e1e21]" />

        {/* Selections */}
        <div className="flex flex-col gap-3">
          <SummaryChips label="Calzado" items={config.calzado} custom={config.custom_calzado} />
          <SummaryChips label="Accesorios" items={config.accesorios} custom={config.custom_accesorios} />
          <SummaryChips label="Complementos" items={config.complementos} custom={config.custom_complementos} />
          <SummaryValue label="Locacion" value={config.custom_location || config.location} />
          <SummaryValue label="Pose" value={config.custom_pose || config.pose} />
          <SummaryValue label="Iluminacion" value={config.custom_lighting || config.lighting} />
          {config.custom_prompt && <SummaryValue label="Prompt" value={config.custom_prompt} />}
        </div>

        <div className="flex-1" />
        <div className="h-px bg-[#1e1e21]" />

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[18px] font-bold text-[#FAFAFA]">
            <Zap size={18} fill="#BEFF00" color="#BEFF00" />
            {credits} creditos
          </span>
          <span className="text-[12px] text-[#52525B] bg-[#1e1e21] px-2 py-1 rounded-md">IG 4:5</span>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex items-center justify-center gap-2 h-[50px] rounded-[12px] bg-[#BEFF00] text-[16px] font-bold text-[#09090B] cursor-pointer hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <Zap size={18} fill="#09090B" color="#09090B" />
          Generar Foto
        </button>
      </div>
    </div>
  );
}

/* ── Accordion (collapsible card) ── */

function Accordion({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-[12px] border transition-colors ${open ? "border-[#27272A] bg-[#0c0c0d]" : "border-[#1e1e21] bg-[#0c0c0d]"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 group"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-[15px] font-semibold text-[#FAFAFA]">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span className="text-[11px] font-semibold text-[#BEFF00] bg-[#BEFF00]/10 min-w-[22px] h-[22px] flex items-center justify-center rounded-full px-1.5">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-[#52525B] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Check Item ── */

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center gap-3 rounded-[8px] border px-3.5 py-2.5 text-left transition-all ${
        checked
          ? "border-[#BEFF00]/50 bg-[#BEFF00]/5"
          : "border-[#1a1a1d] bg-[#09090B] hover:border-[#3f3f46]"
      }`}
    >
      <span
        className={`shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded-[4px] border-2 transition-all ${
          checked ? "bg-[#BEFF00] border-[#BEFF00]" : "border-[#3f3f46]"
        }`}
      >
        {checked && <Check size={12} className="text-[#09090B]" strokeWidth={3} />}
      </span>
      <span className={`text-[14px] ${checked ? "text-[#FAFAFA] font-medium" : "text-[#A1A1AA]"}`}>
        {label}
      </span>
    </button>
  );
}

/* ── Radio Item ── */

function RadioItem({
  label,
  selected,
  onSelect,
  badge,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 rounded-[8px] border px-3.5 py-2.5 text-left transition-all ${
        selected
          ? "border-[#BEFF00]/50 bg-[#BEFF00]/5"
          : "border-[#1a1a1d] bg-[#09090B] hover:border-[#3f3f46]"
      }`}
    >
      <span
        className={`shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 transition-all ${
          selected ? "border-[#BEFF00]" : "border-[#3f3f46]"
        }`}
      >
        {selected && <span className="block w-2 h-2 rounded-full bg-[#BEFF00]" />}
      </span>
      <span className={`text-[14px] flex-1 ${selected ? "text-[#FAFAFA] font-medium" : "text-[#A1A1AA]"}`}>
        {badge && <span className="text-[#BEFF00] text-[10px] font-bold mr-1.5">{badge}</span>}
        {label}
      </span>
    </button>
  );
}

/* ── Model Card ── */

function ModelCard({
  name,
  description,
  cost,
  selected,
  onSelect,
}: {
  name: string;
  description: string;
  cost: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col gap-1 rounded-[10px] border px-4 py-3.5 text-left transition-all ${
        selected
          ? "border-[#BEFF00]/60 bg-[#BEFF00]/5"
          : "border-[#1e1e21] bg-[#09090B] hover:border-[#3f3f46]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-full border-2 ${
            selected ? "border-[#BEFF00]" : "border-[#3f3f46]"
          }`}
        >
          {selected && <span className="block w-2 h-2 rounded-full bg-[#BEFF00]" />}
        </span>
        <span className={`text-[15px] font-semibold ${selected ? "text-[#BEFF00]" : "text-[#A1A1AA]"}`}>{name}</span>
      </div>
      <span className="text-[12px] text-[#52525B] pl-6">{description}</span>
      <span className="text-[12px] text-[#71717A] pl-6 flex items-center gap-1 mt-0.5">
        <Zap size={10} fill="#71717A" color="#71717A" />{cost} creditos
      </span>
    </button>
  );
}

/* ── Custom Input ── */

function CustomInput({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(!!value);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[13px] text-[#52525B] hover:text-[#A1A1AA] transition-colors mt-1"
      >
        <Plus size={14} />
        <span>Agregar personalizado</span>
      </button>
    );
  }

  return (
    <div className="flex gap-2 mt-1">
      <input
        type="text"
        autoFocus
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-[42px] rounded-[10px] border border-[#27272A] bg-[#09090B] px-4 text-[14px] text-[#FAFAFA] placeholder:text-[#3f3f46] focus:border-[#BEFF00]/50 focus:outline-none transition-colors"
      />
      <button
        onClick={() => {
          setOpen(false);
          onChange("");
        }}
        className="h-[42px] w-[42px] rounded-[10px] border border-[#27272A] flex items-center justify-center text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B] transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ── Summary helpers ── */

function SummaryValue({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#52525B] mb-0.5">{label}</p>
      <p className={`text-[13px] leading-snug ${value ? "text-[#D4D4D8]" : "text-[#27272A]"}`}>
        {value ? (value.length > 60 ? value.slice(0, 60) + "..." : value) : "Sin seleccionar"}
      </p>
    </div>
  );
}

function SummaryChips({ label, items, custom }: { label: string; items?: string[]; custom?: string }) {
  const count = (items?.length ?? 0) + (custom ? 1 : 0);
  return (
    <div>
      <p className="text-[11px] text-[#52525B] mb-0.5">{label}</p>
      {count === 0 ? (
        <p className="text-[13px] text-[#27272A]">Sin seleccionar</p>
      ) : (
        <p className="text-[13px] text-[#D4D4D8]">
          {count} {count === 1 ? "seleccionado" : "seleccionados"}
          {custom && <span className="text-[#BEFF00]"> + personalizado</span>}
        </p>
      )}
    </div>
  );
}
