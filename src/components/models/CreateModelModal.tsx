"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Loader2, Sparkles, RefreshCw, Save, Pencil } from "lucide-react";
/* eslint-disable @next/next/no-img-element */
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];

interface ModelMetadataFemale {
  height_cm: number;
  weight_kg: number;
  bust_cm: number;
  waist_cm: number;
  hips_cm: number;
  skin_tone: string;
  hair_color: string;
  hair_length: string;
  hair_texture: string;
  eye_color: string;
  face_shape: string;
  body_type: string;
  ethnicity_appearance: string;
  distinguishing_features: string;
  full_description: string;
}

interface ModelMetadataMale {
  height_cm: number;
  weight_kg: number;
  chest_cm: number;
  waist_cm: number;
  shoulder_width_cm: number;
  skin_tone: string;
  hair_color: string;
  hair_length: string;
  hair_texture: string;
  facial_hair: string;
  eye_color: string;
  face_shape: string;
  body_type: string;
  ethnicity_appearance: string;
  distinguishing_features: string;
  full_description: string;
}

type ModelMetadata = ModelMetadataFemale | ModelMetadataMale;

function isMaleMetadata(
  metadata: ModelMetadata,
  gender: string,
): metadata is ModelMetadataMale {
  return gender === "male";
}

interface CreateModelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "form" | "generating" | "profile" | "generating-face" | "complete";

export function CreateModelModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateModelModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("female");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [style, setStyle] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [createdModel, setCreatedModel] = useState<FashionModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<Record<string, string | number> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rawMetadata = createdModel?.metadata as ModelMetadata | null;
  const metadata = editedMetadata
    ? (editedMetadata as unknown as ModelMetadata)
    : rawMetadata;
  const modelGender = createdModel?.gender ?? gender;

  const resetForm = () => {
    setName("");
    setGender("female");
    setAge("");
    setCountry("");
    setStyle("");
    setStep("form");
    setError(null);
    setCreatedModel(null);
    setIsEditing(false);
    setEditedMetadata(null);
  };

  const handleClose = () => {
    if (step === "generating" || step === "generating-face") return;
    resetForm();
    onOpenChange(false);
    if (createdModel) onSuccess();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setStep("generating");
    setError(null);

    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          age: age ? parseInt(age, 10) : undefined,
          country: country.trim() || undefined,
          style: style.trim() || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to create model");
        setStep("form");
        return;
      }

      setCreatedModel(result);
      setIsEditing(true);
      setEditedMetadata(
        result.metadata ? { ...(result.metadata as Record<string, string | number>) } : null,
      );
      setStep("profile");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  };

  const handleRegenerateProfile = async () => {
    if (!createdModel) return;
    setStep("generating");
    setError(null);
    setIsEditing(false);
    setEditedMetadata(null);

    try {
      const res = await fetch(
        `/api/models/${createdModel.id}/generate-profile`,
        { method: "POST" },
      );
      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to regenerate profile");
        setStep("profile");
        return;
      }

      setCreatedModel(result);
      setIsEditing(true);
      setEditedMetadata(
        result.metadata ? { ...(result.metadata as Record<string, string | number>) } : null,
      );
      setStep("profile");
    } catch {
      setError("Failed to regenerate. Try again.");
      setStep("profile");
    }
  };

  const handleSaveMetadata = async () => {
    if (!createdModel || !editedMetadata) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/models/${createdModel.id}/metadata`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: editedMetadata }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to save changes");
        setIsSaving(false);
        return;
      }

      setCreatedModel(result);
      setIsEditing(false);
      setEditedMetadata(null);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditing = () => {
    if (!metadata) return;
    setEditedMetadata({ ...(metadata as unknown as Record<string, string | number>) });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedMetadata(null);
  };

  const updateField = (key: string, value: string | number) => {
    setEditedMetadata((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleGenerateFace = async () => {
    if (!createdModel) return;
    setStep("generating-face");
    setError(null);

    try {
      const res = await fetch(`/api/models/${createdModel.id}/generate-face`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to generate face");
        setStep("profile");
        return;
      }

      setCreatedModel(result);
      setStep("complete");
    } catch {
      setError("Failed to generate face. Try again.");
      setStep("profile");
    }
  };

  const inputClass =
    "w-full h-[42px] rounded-[10px] bg-[#09090B] border border-[#27272A] px-[14px] text-[14px] text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#BEFF00]/50 transition-colors";

  const editInputClass =
    "w-full h-[34px] rounded-[8px] bg-[#09090B] border border-[#27272A] px-[10px] text-[12px] text-[#FAFAFA] outline-none focus:border-[#BEFF00]/50 transition-colors";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="!w-full sm:!w-[620px] !max-w-[calc(100%-2rem)] sm:!max-w-[620px] !rounded-[20px] !bg-[#18181B] !border !border-[#27272A] !px-4 sm:!px-[28px] !py-[20px] sm:!py-[24px] !gap-[16px] sm:!gap-[20px] !ring-0"
      >
        {/* Header */}
        <div className="flex items-center h-[36px]">
          <h2 className="font-heading text-[18px] font-bold text-[#FAFAFA]">
            {step === "form" && "Create New Model"}
            {step === "generating" && "Generating Profile..."}
            {step === "profile" && "Model Profile"}
            {step === "generating-face" && "Generating Portrait..."}
            {step === "complete" && "Model Ready"}
          </h2>
          <div className="flex-1" />
          {step === "profile" && !isEditing && (
            <button
              onClick={handleStartEditing}
              className="w-[32px] h-[32px] rounded-[8px] bg-[#27272A] flex items-center justify-center hover:bg-[#3f3f46] transition-colors mr-2"
              title="Edit metadata"
            >
              <Pencil size={14} className="text-[#BEFF00]" />
            </button>
          )}
          <button
            onClick={handleClose}
            disabled={step === "generating" || step === "generating-face"}
            className="w-[32px] h-[32px] rounded-[8px] bg-[#27272A] flex items-center justify-center hover:bg-[#3f3f46] transition-colors disabled:opacity-50"
          >
            <X size={16} className="text-[#71717A]" />
          </button>
        </div>

        <div className="h-px bg-[#27272A] -mx-4 sm:-mx-[28px]" />

        {/* ─── STEP: FORM ─── */}
        {step === "form" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Aria Santos"
                className={inputClass}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#A1A1AA]">
                  Gender
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
              <div className="w-[120px] flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#A1A1AA]">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="24"
                  min={16}
                  max={80}
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
                placeholder="e.g., Colombia"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">
                Style Description
              </label>
              <textarea
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Describe the style... e.g., editorial high fashion, elegant but urban"
                rows={3}
                className="w-full h-[90px] rounded-[10px] bg-[#09090B] border border-[#27272A] px-[14px] py-[12px] text-[14px] text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#BEFF00]/50 transition-colors resize-none"
              />
            </div>

            <p className="text-[12px] text-[#52525B]">
              AI will generate physical characteristics and a face portrait.
            </p>

            {error && <p className="text-[13px] text-red-400">{error}</p>}
          </div>
        )}

        {/* ─── STEP: GENERATING ─── */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#BEFF00]/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#BEFF00] animate-spin" />
              </div>
            </div>
            <p className="text-[14px] text-[#A1A1AA]">
              Generating model profile with AI...
            </p>
            <p className="text-[12px] text-[#52525B]">
              Creating physical characteristics, measurements, and description
            </p>
          </div>
        )}

        {/* ─── STEP: PROFILE (show generated metadata — editable) ─── */}
        {(step === "profile" ||
          step === "generating-face" ||
          step === "complete") &&
          metadata && (
            <div className="flex flex-col gap-4 max-h-[55vh] sm:max-h-[460px] overflow-y-auto pr-1">
              {/* Info banner when editing */}
              {isEditing && step === "profile" && (
                <div className="rounded-[10px] bg-[#BEFF00]/5 border border-[#BEFF00]/20 px-3 py-2">
                  <p className="text-[12px] text-[#BEFF00]">
                    ✏️ Editing mode — modify any field below, then save before
                    generating the portrait.
                  </p>
                </div>
              )}

              {/* Face + basic info row */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                {/* Face preview */}
                <div className="w-full sm:w-[140px] h-[200px] sm:h-[180px] rounded-[12px] overflow-hidden bg-[#27272A] shrink-0 flex items-center justify-center">
                  {createdModel?.ref_face_url ? (
                    <img
                      src={createdModel.ref_face_url}
                      alt={createdModel.name}
                      className="object-cover w-full h-full"
                    />
                  ) : step === "generating-face" ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#BEFF00] animate-spin" />
                      <span className="text-[10px] text-[#52525B]">
                        Generating...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-3">
                      <span className="text-3xl text-[#52525B]">&#128100;</span>
                      <span className="text-[10px] text-[#52525B] text-center">
                        No portrait yet
                      </span>
                    </div>
                  )}
                </div>

                {/* Basic info */}
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-[16px] font-bold text-[#FAFAFA]">
                    {createdModel?.name}
                  </h3>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <EditableField
                        label="Height (cm)"
                        value={metadata.height_cm}
                        type="number"
                        onChange={(v) => updateField("height_cm", Number(v))}
                        inputClass={editInputClass}
                      />
                      <EditableField
                        label="Weight (kg)"
                        value={metadata.weight_kg}
                        type="number"
                        onChange={(v) => updateField("weight_kg", Number(v))}
                        inputClass={editInputClass}
                      />
                      <EditableField
                        label="Body Type"
                        value={metadata.body_type}
                        onChange={(v) => updateField("body_type", v)}
                        inputClass={editInputClass}
                      />
                      <EditableField
                        label="Face Shape"
                        value={metadata.face_shape}
                        onChange={(v) => updateField("face_shape", v)}
                        inputClass={editInputClass}
                      />
                      <EditableField
                        label="Skin Tone"
                        value={metadata.skin_tone}
                        onChange={(v) => updateField("skin_tone", v)}
                        inputClass={editInputClass}
                      />
                      <EditableField
                        label="Ethnicity"
                        value={metadata.ethnicity_appearance}
                        onChange={(v) =>
                          updateField("ethnicity_appearance", v)
                        }
                        inputClass={editInputClass}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <InfoItem
                        label="Height"
                        value={`${metadata.height_cm} cm`}
                      />
                      <InfoItem
                        label="Weight"
                        value={`${metadata.weight_kg} kg`}
                      />
                      <InfoItem label="Body" value={metadata.body_type} />
                      <InfoItem label="Face" value={metadata.face_shape} />
                      <InfoItem label="Skin" value={metadata.skin_tone} />
                      <InfoItem
                        label="Ethnicity"
                        value={metadata.ethnicity_appearance}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Measurements — gender-specific */}
              {isEditing ? (
                <div className="flex gap-3">
                  {isMaleMetadata(metadata, modelGender) ? (
                    <>
                      <EditableMeasure
                        label="Chest"
                        value={metadata.chest_cm}
                        onChange={(v) => updateField("chest_cm", Number(v))}
                        inputClass={editInputClass}
                      />
                      <EditableMeasure
                        label="Waist"
                        value={metadata.waist_cm}
                        onChange={(v) => updateField("waist_cm", Number(v))}
                        inputClass={editInputClass}
                      />
                      <EditableMeasure
                        label="Shoulders"
                        value={metadata.shoulder_width_cm}
                        onChange={(v) =>
                          updateField("shoulder_width_cm", Number(v))
                        }
                        inputClass={editInputClass}
                      />
                    </>
                  ) : (
                    <>
                      <EditableMeasure
                        label="Bust"
                        value={(metadata as ModelMetadataFemale).bust_cm}
                        onChange={(v) => updateField("bust_cm", Number(v))}
                        inputClass={editInputClass}
                      />
                      <EditableMeasure
                        label="Waist"
                        value={metadata.waist_cm}
                        onChange={(v) => updateField("waist_cm", Number(v))}
                        inputClass={editInputClass}
                      />
                      <EditableMeasure
                        label="Hips"
                        value={(metadata as ModelMetadataFemale).hips_cm}
                        onChange={(v) => updateField("hips_cm", Number(v))}
                        inputClass={editInputClass}
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="flex gap-3">
                  {isMaleMetadata(metadata, modelGender) ? (
                    <>
                      <MeasureBadge
                        label="Chest"
                        value={`${metadata.chest_cm}cm`}
                      />
                      <MeasureBadge
                        label="Waist"
                        value={`${metadata.waist_cm}cm`}
                      />
                      <MeasureBadge
                        label="Shoulders"
                        value={`${metadata.shoulder_width_cm}cm`}
                      />
                    </>
                  ) : (
                    <>
                      <MeasureBadge
                        label="Bust"
                        value={`${(metadata as ModelMetadataFemale).bust_cm}cm`}
                      />
                      <MeasureBadge
                        label="Waist"
                        value={`${metadata.waist_cm}cm`}
                      />
                      <MeasureBadge
                        label="Hips"
                        value={`${(metadata as ModelMetadataFemale).hips_cm}cm`}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Hair & Eyes */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[10px] bg-[#09090B] border border-[#27272A] p-3 flex flex-col gap-2">
                    <p className="text-[11px] font-medium text-[#52525B]">
                      HAIR
                    </p>
                    <EditableField
                      label="Color"
                      value={metadata.hair_color}
                      onChange={(v) => updateField("hair_color", v)}
                      inputClass={editInputClass}
                    />
                    <EditableField
                      label="Length"
                      value={metadata.hair_length}
                      onChange={(v) => updateField("hair_length", v)}
                      inputClass={editInputClass}
                    />
                    <EditableField
                      label="Texture"
                      value={metadata.hair_texture}
                      onChange={(v) => updateField("hair_texture", v)}
                      inputClass={editInputClass}
                    />
                    {isMaleMetadata(metadata, modelGender) && (
                      <EditableField
                        label="Facial Hair"
                        value={metadata.facial_hair}
                        onChange={(v) => updateField("facial_hair", v)}
                        inputClass={editInputClass}
                      />
                    )}
                  </div>
                  <div className="rounded-[10px] bg-[#09090B] border border-[#27272A] p-3 flex flex-col gap-2">
                    <p className="text-[11px] font-medium text-[#52525B]">
                      FEATURES
                    </p>
                    <EditableField
                      label="Eye Color"
                      value={metadata.eye_color}
                      onChange={(v) => updateField("eye_color", v)}
                      inputClass={editInputClass}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#52525B]">
                        Distinguishing Features
                      </span>
                      <textarea
                        value={metadata.distinguishing_features}
                        onChange={(e) =>
                          updateField("distinguishing_features", e.target.value)
                        }
                        rows={2}
                        className="w-full rounded-[8px] bg-[#09090B] border border-[#27272A] px-[10px] py-[6px] text-[12px] text-[#FAFAFA] outline-none focus:border-[#BEFF00]/50 transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <DetailCard
                    title="Hair"
                    items={[
                      `Color: ${metadata.hair_color}`,
                      `Length: ${metadata.hair_length}`,
                      `Texture: ${metadata.hair_texture}`,
                      ...(isMaleMetadata(metadata, modelGender)
                        ? [`Facial: ${metadata.facial_hair}`]
                        : []),
                    ]}
                  />
                  <DetailCard
                    title="Features"
                    items={[
                      `Eyes: ${metadata.eye_color}`,
                      metadata.distinguishing_features,
                    ]}
                  />
                </div>
              )}

              {/* Full description */}
              {isEditing ? (
                <div className="rounded-[10px] bg-[#09090B] border border-[#27272A] p-3">
                  <p className="text-[11px] font-medium text-[#52525B] mb-1.5">
                    AI DESCRIPTION{" "}
                    <span className="text-[#BEFF00]">
                      (used for face generation)
                    </span>
                  </p>
                  <textarea
                    value={metadata.full_description}
                    onChange={(e) =>
                      updateField("full_description", e.target.value)
                    }
                    rows={4}
                    className="w-full rounded-[8px] bg-[#18181B] border border-[#27272A] px-[10px] py-[8px] text-[12px] text-[#A1A1AA] leading-relaxed outline-none focus:border-[#BEFF00]/50 transition-colors resize-none"
                  />
                </div>
              ) : (
                <div className="rounded-[10px] bg-[#09090B] border border-[#27272A] p-3">
                  <p className="text-[11px] font-medium text-[#52525B] mb-1.5">
                    AI DESCRIPTION
                  </p>
                  <p className="text-[13px] text-[#A1A1AA] leading-relaxed">
                    {metadata.full_description}
                  </p>
                </div>
              )}

              {error && <p className="text-[13px] text-red-400">{error}</p>}
            </div>
          )}

        <div className="h-px bg-[#27272A] -mx-4 sm:-mx-[28px]" />

        {/* ─── FOOTER ACTIONS ─── */}
        <div className="flex items-center justify-end gap-3">
          {step === "form" && (
            <>
              <button
                onClick={handleClose}
                className="h-[40px] rounded-[10px] border border-[#27272A] bg-transparent px-[18px] text-[14px] font-medium text-[#A1A1AA] hover:bg-[#27272A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="h-[40px] rounded-[10px] bg-[#BEFF00] px-[20px] flex items-center gap-2 text-[14px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} />
                Create Model
              </button>
            </>
          )}

          {step === "profile" && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEditing}
                    className="h-[40px] rounded-[10px] border border-[#27272A] bg-transparent px-[18px] text-[14px] font-medium text-[#A1A1AA] hover:bg-[#27272A] transition-colors"
                  >
                    Cancel Edit
                  </button>
                  <button
                    onClick={handleSaveMetadata}
                    disabled={isSaving}
                    className="h-[40px] rounded-[10px] bg-[#BEFF00] px-[20px] flex items-center gap-2 text-[14px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRegenerateProfile}
                    className="h-[40px] rounded-[10px] border border-[#27272A] bg-transparent px-[18px] text-[14px] font-medium text-[#A1A1AA] hover:bg-[#27272A] transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleGenerateFace}
                    className="h-[40px] rounded-[10px] bg-[#BEFF00] px-[20px] flex items-center gap-2 text-[14px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity"
                  >
                    <Sparkles size={14} />
                    Generate Portrait
                  </button>
                </>
              )}
            </>
          )}

          {step === "complete" && (
            <button
              onClick={handleClose}
              className="h-[40px] rounded-[10px] bg-[#BEFF00] px-[20px] flex items-center gap-2 text-[14px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  inputClass,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number";
  inputClass: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[#52525B]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function EditableMeasure({
  label,
  value,
  onChange,
  inputClass,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  inputClass: string;
}) {
  return (
    <div className="flex-1 rounded-[10px] bg-[#09090B] border border-[#27272A] p-2 flex flex-col items-center gap-1">
      <span className="text-[10px] text-[#52525B]">{label} (cm)</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[28px] rounded-[6px] bg-[#18181B] border border-[#27272A] px-2 text-[13px] text-center font-semibold text-[#FAFAFA] outline-none focus:border-[#BEFF00]/50"
      />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[11px] text-[#52525B]">{label}: </span>
      <span className="text-[12px] text-[#A1A1AA]">{value}</span>
    </div>
  );
}

function MeasureBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 h-[48px] rounded-[10px] bg-[#09090B] border border-[#27272A] flex flex-col items-center justify-center">
      <span className="text-[11px] text-[#52525B]">{label}</span>
      <span className="text-[14px] font-semibold text-[#FAFAFA]">{value}</span>
    </div>
  );
}

function DetailCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[10px] bg-[#09090B] border border-[#27272A] p-3">
      <p className="text-[11px] font-medium text-[#52525B] mb-1.5">{title}</p>
      {items.map((item, i) => (
        <p key={i} className="text-[12px] text-[#A1A1AA]">
          {item}
        </p>
      ))}
    </div>
  );
}
