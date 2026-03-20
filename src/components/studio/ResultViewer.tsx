/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Download,
  RefreshCw,
  ChevronRight,
  Sparkles,
  RotateCcw,
  X,
} from "lucide-react";

interface GenerationOutput {
  id: string;
  image_url: string | null;
  angle: string | null;
}

interface ResultViewerProps {
  result: {
    id: string;
    status: string;
    outputs: GenerationOutput[];
  };
  onMultiAngle: (angles: string[]) => void;
  onRegen: () => void;
  onNewGeneration: () => void;
}

const ANGLE_OPTIONS = [
  { value: "front", label: "Front", icon: "↑" },
  { value: "back", label: "Back", icon: "↓" },
  { value: "left_side", label: "Left Side", icon: "←" },
  { value: "right_side", label: "Right Side", icon: "→" },
  { value: "three_quarter_left", label: "3/4 Left", icon: "↖" },
  { value: "three_quarter_right", label: "3/4 Right", icon: "↗" },
  { value: "high_angle", label: "From Above", icon: "⤓" },
  { value: "low_angle", label: "From Below", icon: "⤒" },
];

export function ResultViewer({
  result,
  onMultiAngle,
  onRegen,
  onNewGeneration,
}: ResultViewerProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
  const [viewIndex, setViewIndex] = useState(0);

  const outputs = result.outputs;
  const currentOutput = outputs[viewIndex] ?? outputs[0];
  const imageUrl = currentOutput?.image_url ?? "";

  function handleDownload() {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `fashia-${result.id}-${viewIndex}.png`;
    link.click();
  }

  async function handleFavorite() {
    setFavorited(!favorited);
    if (currentOutput) {
      await fetch(`/api/gallery/${currentOutput.id}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !favorited }),
      });
    }
  }

  function toggleAngle(angle: string) {
    setSelectedAngles((prev) =>
      prev.includes(angle) ? prev.filter((a) => a !== angle) : [...prev, angle],
    );
  }

  function handleConfirmAngles() {
    if (selectedAngles.length === 0) return;
    setShowAngleModal(false);
    onMultiAngle(selectedAngles);
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-5 py-4 px-4 sm:py-8 sm:px-10">
      <h1 className="font-heading text-[22px] font-bold text-[#FAFAFA]">
        Your Photo is Ready
      </h1>

      {/* Output thumbnails if multiple */}
      {outputs.length > 1 && (
        <div className="flex gap-2 w-full max-w-[460px] overflow-x-auto pb-1">
          {outputs.map((output, i) => (
            <button
              key={output.id}
              onClick={() => setViewIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === viewIndex
                  ? "border-[#BEFF00]"
                  : "border-[#27272A] hover:border-[#3f3f46]"
              }`}
            >
              {output.image_url ? (
                <img
                  src={output.image_url}
                  alt={output.angle ?? `Output ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#18181B]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Photo */}
      <div
        className="overflow-hidden rounded-2xl w-full max-w-[460px]"
        style={{ boxShadow: "0 0 40px #00000066" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Generated photo"
            className="w-full h-auto block"
          />
        ) : (
          <div className="w-full aspect-[9/16] bg-[#18181B] flex items-center justify-center">
            <span className="text-[14px] text-[#52525B]">No image available</span>
          </div>
        )}
      </div>

      {/* Angle label */}
      {currentOutput?.angle && (
        <span className="text-[11px] text-[#52525B] uppercase tracking-wider">
          {currentOutput.angle.replace(/_/g, " ")}
        </span>
      )}

      {/* Action Bar */}
      <div className="grid grid-cols-4 rounded-[10px] bg-[#18181B] border border-[#27272A] w-full max-w-[460px] h-12">
        <button
          type="button"
          onClick={handleFavorite}
          className="flex items-center justify-center gap-1 sm:gap-1.5 h-full cursor-pointer hover:bg-[#27272A]/50 transition-colors border-r border-[#27272A]"
        >
          <Star
            size={14}
            className={favorited ? "text-[#BEFF00]" : "text-[#71717A]"}
            fill={favorited ? "#BEFF00" : "none"}
          />
          <span className="text-[11px] sm:text-[12px] text-[#71717A] hidden sm:inline">Favorite</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center justify-center gap-1 sm:gap-1.5 h-full cursor-pointer hover:bg-[#27272A]/50 transition-colors border-r border-[#27272A]"
        >
          <Download size={14} className="text-[#71717A]" />
          <span className="text-[11px] sm:text-[12px] text-[#71717A] hidden sm:inline">Download</span>
        </button>

        <button
          type="button"
          onClick={onRegen}
          className="flex items-center justify-center gap-1 sm:gap-1.5 h-full cursor-pointer hover:bg-[#27272A]/50 transition-colors border-r border-[#27272A]"
        >
          <RefreshCw size={14} className="text-[#71717A]" />
          <span className="text-[11px] sm:text-[12px] text-[#71717A] hidden sm:inline">Re-gen</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAngleModal(true)}
          className="flex items-center justify-center gap-1 sm:gap-1.5 h-full cursor-pointer hover:bg-[#27272A]/50 transition-colors"
        >
          <RotateCcw size={14} className="text-[#71717A]" />
          <span className="text-[11px] sm:text-[12px] text-[#71717A] hidden sm:inline">Angles</span>
        </button>
      </div>

      {/* Prompt Row */}
      <button
        type="button"
        onClick={() => setShowPrompt(!showPrompt)}
        className="flex items-center h-[36px] px-[14px] rounded-lg bg-[#18181B] border border-[#27272A] cursor-pointer hover:border-[#3f3f46] transition-colors w-full max-w-[460px]"
      >
        <ChevronRight size={14} className="text-[#52525B]" />
        <span className="text-[12px] text-[#52525B] ml-2">Prompt used</span>
        <span className="flex-1" />
        <span className="text-[12px] text-[#71717A]">{showPrompt ? "Hide" : "Show"}</span>
      </button>

      {showPrompt && (
        <div className="rounded-lg bg-[#18181B] border border-[#27272A] p-4 text-[12px] text-[#A1A1AA] w-full max-w-[460px]">
          Generation prompt details are available in the generation record.
        </div>
      )}

      {/* Bottom Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[460px]">
        <button
          type="button"
          onClick={onNewGeneration}
          className="flex items-center justify-center gap-1.5 h-[40px] px-[18px] rounded-[10px] bg-[#BEFF00] text-[13px] font-semibold text-[#09090B] cursor-pointer hover:opacity-90 transition-opacity w-full sm:w-auto"
        >
          <Sparkles size={14} />
          New Session
        </button>
        <span className="hidden sm:block flex-1" />
        <Link
          href="/gallery"
          className="text-[13px] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
        >
          View in Gallery →
        </Link>
      </div>

      {/* ─── MULTI-ANGLE MODAL ─── */}
      {showAngleModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
          <div className="w-full sm:w-[420px] rounded-t-[20px] sm:rounded-[20px] bg-[#18181B] border border-[#27272A] p-5 sm:p-6 space-y-4 sm:space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[16px] font-bold text-[#FAFAFA]">
                Multi-Angle Generation
              </h2>
              <button
                onClick={() => setShowAngleModal(false)}
                className="w-8 h-8 rounded-lg bg-[#27272A] flex items-center justify-center hover:bg-[#3f3f46] transition-colors"
              >
                <X size={14} className="text-[#71717A]" />
              </button>
            </div>

            <p className="text-[12px] text-[#52525B]">
              Select the angles you want. Each angle costs 3 credits.
              The AI will use your generated photo as reference and create variations from different perspectives.
            </p>

            {/* Angle Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ANGLE_OPTIONS.map((angle) => {
                const isSelected = selectedAngles.includes(angle.value);
                return (
                  <button
                    key={angle.value}
                    onClick={() => toggleAngle(angle.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-[10px] border transition-all ${
                      isSelected
                        ? "border-[#BEFF00] bg-[#BEFF00]/5"
                        : "border-[#27272A] bg-[#09090B] hover:border-[#3f3f46]"
                    }`}
                  >
                    <span className="text-xl">{angle.icon}</span>
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected ? "text-[#BEFF00]" : "text-[#71717A]"
                      }`}
                    >
                      {angle.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[13px] text-[#A1A1AA]">
                {selectedAngles.length > 0
                  ? `${selectedAngles.length} angle${selectedAngles.length > 1 ? "s" : ""} · ${selectedAngles.length * 3} credits`
                  : "Select angles"}
              </span>
              <button
                onClick={handleConfirmAngles}
                disabled={selectedAngles.length === 0}
                className="h-[38px] rounded-[10px] bg-[#BEFF00] px-5 text-[13px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
