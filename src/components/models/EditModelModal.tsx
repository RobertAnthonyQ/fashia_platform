"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Loader2, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];

interface EditModelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: FashionModel | null;
  onSuccess: () => void;
}

type Tab = "basic" | "metadata";

export function EditModelModal({
  open,
  onOpenChange,
  model,
  onSuccess,
}: EditModelModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<string>("female");
  const [country, setCountry] = useState("");
  const [age, setAge] = useState<string>("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("basic");
  const [metadata, setMetadata] = useState<Record<string, string | number> | null>(null);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (model) {
      setName(model.name);
      setGender(model.gender);
      setCountry(model.country ?? "");
      setAge(model.age?.toString() ?? "");
      setStyle(model.style ?? "");
      setMetadata(
        model.metadata
          ? { ...(model.metadata as Record<string, string | number>) }
          : null,
      );
      setTab("basic");
    }
  }, [model]);

  const isMale = gender === "male";

  const updateField = (key: string, value: string | number) => {
    setMetadata((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  async function handleSaveBasic(e: React.FormEvent) {
    e.preventDefault();
    if (!model || !name.trim()) return;

    setLoading(true);
    const res = await fetch(`/api/models/${model.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        gender,
        country: country.trim() || undefined,
        age: age ? Number(age) : undefined,
        style: style.trim() || undefined,
      }),
    });

    setLoading(false);
    if (res.ok) {
      toast.success("Model updated");
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to update model");
    }
  }

  async function handleSaveMetadata() {
    if (!model || !metadata) return;
    setSavingMetadata(true);

    const res = await fetch(`/api/models/${model.id}/metadata`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata }),
    });

    setSavingMetadata(false);
    if (res.ok) {
      toast.success("Metadata saved");
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to save metadata");
    }
  }

  async function handleRegenerateProfile() {
    if (!model) return;
    setRegenerating(true);

    try {
      const res = await fetch(`/api/models/${model.id}/generate-profile`, {
        method: "POST",
      });
      const result = await res.json();

      if (res.ok) {
        setMetadata(
          result.metadata
            ? { ...(result.metadata as Record<string, string | number>) }
            : null,
        );
        toast.success("Profile regenerated");
      } else {
        toast.error(result.error ?? "Failed to regenerate");
      }
    } catch {
      toast.error("Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  }

  const inputClass =
    "w-full h-[38px] rounded-[8px] bg-[#09090B] border border-[#27272A] px-[12px] text-[13px] text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#BEFF00]/50 transition-colors";

  const editInputClass =
    "w-full h-[32px] rounded-[7px] bg-[#09090B] border border-[#27272A] px-[10px] text-[12px] text-[#FAFAFA] outline-none focus:border-[#BEFF00]/50 transition-colors";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!w-full sm:!w-[560px] !max-w-[calc(100%-2rem)] sm:!max-w-[560px] !rounded-[20px] !bg-[#18181B] !border !border-[#27272A] !px-4 sm:!px-[28px] !py-[20px] sm:!py-[24px] !gap-[16px] sm:!gap-[20px] !ring-0"
      >
        {/* Header */}
        <div className="flex items-center h-[36px]">
          <h2 className="font-heading text-[18px] font-bold text-[#FAFAFA]">
            Edit Model
          </h2>
          <div className="flex-1" />
          <button
            onClick={() => onOpenChange(false)}
            className="w-[32px] h-[32px] rounded-[8px] bg-[#27272A] flex items-center justify-center hover:bg-[#3f3f46] transition-colors"
          >
            <X size={16} className="text-[#71717A]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#09090B] rounded-[10px] p-1">
          <button
            onClick={() => setTab("basic")}
            className={`flex-1 h-[32px] rounded-[8px] text-[13px] font-medium transition-colors ${
              tab === "basic"
                ? "bg-[#27272A] text-[#FAFAFA]"
                : "text-[#71717A] hover:text-[#A1A1AA]"
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setTab("metadata")}
            disabled={!metadata}
            className={`flex-1 h-[32px] rounded-[8px] text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === "metadata"
                ? "bg-[#27272A] text-[#FAFAFA]"
                : "text-[#71717A] hover:text-[#A1A1AA]"
            }`}
          >
            Physical Profile
          </button>
        </div>

        <div className="h-px bg-[#27272A] -mx-4 sm:-mx-[28px]" />

        {/* ─── TAB: BASIC ─── */}
        {tab === "basic" && (
          <form onSubmit={handleSaveBasic} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#A1A1AA]">
                  Gender *
                </label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`${inputClass} appearance-none pr-[36px] cursor-pointer`}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non_binary">Non-binary</option>
                  </select>
                  <span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#52525B] text-sm pointer-events-none">
                    &#9662;
                  </span>
                </div>
              </div>
              <div className="w-[100px] flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#A1A1AA]">
                  Age
                </label>
                <input
                  type="number"
                  min={16}
                  max={80}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">
                Style
              </label>
              <textarea
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                rows={2}
                className="w-full h-[70px] rounded-[8px] bg-[#09090B] border border-[#27272A] px-[12px] py-[8px] text-[13px] text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#BEFF00]/50 transition-colors resize-none"
              />
            </div>

            <div className="h-px bg-[#27272A] -mx-4 sm:-mx-[28px]" />

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-[40px] rounded-[10px] bg-[#BEFF00] px-[20px] flex items-center justify-center gap-2 text-[14px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </form>
        )}

        {/* ─── TAB: METADATA ─── */}
        {tab === "metadata" && metadata && (
          <div className="flex flex-col gap-4 max-h-[55vh] sm:max-h-[420px] overflow-y-auto pr-1">
            {/* Measurements */}
            <div>
              <p className="text-[11px] font-medium text-[#52525B] mb-2">
                BODY MEASUREMENTS
              </p>
              <div className="grid grid-cols-2 gap-3">
                <EditField
                  label="Height (cm)"
                  value={metadata.height_cm}
                  type="number"
                  onChange={(v) => updateField("height_cm", Number(v))}
                  inputClass={editInputClass}
                />
                <EditField
                  label="Weight (kg)"
                  value={metadata.weight_kg}
                  type="number"
                  onChange={(v) => updateField("weight_kg", Number(v))}
                  inputClass={editInputClass}
                />
                {isMale ? (
                  <>
                    <EditField
                      label="Chest (cm)"
                      value={metadata.chest_cm}
                      type="number"
                      onChange={(v) => updateField("chest_cm", Number(v))}
                      inputClass={editInputClass}
                    />
                    <EditField
                      label="Shoulders (cm)"
                      value={metadata.shoulder_width_cm}
                      type="number"
                      onChange={(v) =>
                        updateField("shoulder_width_cm", Number(v))
                      }
                      inputClass={editInputClass}
                    />
                  </>
                ) : (
                  <>
                    <EditField
                      label="Bust (cm)"
                      value={metadata.bust_cm}
                      type="number"
                      onChange={(v) => updateField("bust_cm", Number(v))}
                      inputClass={editInputClass}
                    />
                    <EditField
                      label="Hips (cm)"
                      value={metadata.hips_cm}
                      type="number"
                      onChange={(v) => updateField("hips_cm", Number(v))}
                      inputClass={editInputClass}
                    />
                  </>
                )}
                <EditField
                  label="Waist (cm)"
                  value={metadata.waist_cm}
                  type="number"
                  onChange={(v) => updateField("waist_cm", Number(v))}
                  inputClass={editInputClass}
                />
                <EditField
                  label="Body Type"
                  value={metadata.body_type}
                  onChange={(v) => updateField("body_type", v)}
                  inputClass={editInputClass}
                />
              </div>
            </div>

            {/* Appearance */}
            <div>
              <p className="text-[11px] font-medium text-[#52525B] mb-2">
                APPEARANCE
              </p>
              <div className="grid grid-cols-2 gap-3">
                <EditField
                  label="Skin Tone"
                  value={metadata.skin_tone}
                  onChange={(v) => updateField("skin_tone", v)}
                  inputClass={editInputClass}
                />
                <EditField
                  label="Eye Color"
                  value={metadata.eye_color}
                  onChange={(v) => updateField("eye_color", v)}
                  inputClass={editInputClass}
                />
                <EditField
                  label="Face Shape"
                  value={metadata.face_shape}
                  onChange={(v) => updateField("face_shape", v)}
                  inputClass={editInputClass}
                />
                <EditField
                  label="Ethnicity"
                  value={metadata.ethnicity_appearance}
                  onChange={(v) => updateField("ethnicity_appearance", v)}
                  inputClass={editInputClass}
                />
              </div>
            </div>

            {/* Hair */}
            <div>
              <p className="text-[11px] font-medium text-[#52525B] mb-2">
                HAIR
              </p>
              <div className="grid grid-cols-2 gap-3">
                <EditField
                  label="Color"
                  value={metadata.hair_color}
                  onChange={(v) => updateField("hair_color", v)}
                  inputClass={editInputClass}
                />
                <EditField
                  label="Length"
                  value={metadata.hair_length}
                  onChange={(v) => updateField("hair_length", v)}
                  inputClass={editInputClass}
                />
                <EditField
                  label="Texture"
                  value={metadata.hair_texture}
                  onChange={(v) => updateField("hair_texture", v)}
                  inputClass={editInputClass}
                />
                {isMale && (
                  <EditField
                    label="Facial Hair"
                    value={metadata.facial_hair}
                    onChange={(v) => updateField("facial_hair", v)}
                    inputClass={editInputClass}
                  />
                )}
              </div>
            </div>

            {/* Features */}
            <div>
              <p className="text-[11px] font-medium text-[#52525B] mb-2">
                DISTINGUISHING FEATURES
              </p>
              <textarea
                value={(metadata.distinguishing_features as string) ?? ""}
                onChange={(e) =>
                  updateField("distinguishing_features", e.target.value)
                }
                rows={2}
                className="w-full rounded-[8px] bg-[#09090B] border border-[#27272A] px-[10px] py-[6px] text-[12px] text-[#FAFAFA] outline-none focus:border-[#BEFF00]/50 transition-colors resize-none"
              />
            </div>

            {/* Full description */}
            <div>
              <p className="text-[11px] font-medium text-[#52525B] mb-2">
                AI DESCRIPTION{" "}
                <span className="text-[#BEFF00]">
                  (used for face generation)
                </span>
              </p>
              <textarea
                value={(metadata.full_description as string) ?? ""}
                onChange={(e) =>
                  updateField("full_description", e.target.value)
                }
                rows={4}
                className="w-full rounded-[8px] bg-[#09090B] border border-[#27272A] px-[10px] py-[8px] text-[12px] text-[#A1A1AA] leading-relaxed outline-none focus:border-[#BEFF00]/50 transition-colors resize-none"
              />
            </div>

            <div className="h-px bg-[#27272A] -mx-4 sm:-mx-[28px]" />

            <div className="flex items-center gap-3">
              <button
                onClick={handleRegenerateProfile}
                disabled={regenerating}
                className="h-[38px] rounded-[10px] border border-[#27272A] bg-transparent px-[16px] text-[13px] font-medium text-[#A1A1AA] hover:bg-[#27272A] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {regenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Regenerate
              </button>
              <div className="flex-1" />
              <button
                onClick={handleSaveMetadata}
                disabled={savingMetadata}
                className="h-[38px] rounded-[10px] bg-[#BEFF00] px-[18px] flex items-center gap-2 text-[13px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingMetadata ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Metadata
              </button>
            </div>
          </div>
        )}

        {tab === "metadata" && !metadata && (
          <div className="flex flex-col items-center py-10 gap-3">
            <p className="text-[13px] text-[#71717A]">
              No physical profile generated yet
            </p>
            <button
              onClick={handleRegenerateProfile}
              disabled={regenerating}
              className="h-[38px] rounded-[10px] bg-[#BEFF00] px-[18px] flex items-center gap-2 text-[13px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {regenerating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Generate Profile
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  inputClass,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: "text" | "number";
  inputClass: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[#52525B]">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}
