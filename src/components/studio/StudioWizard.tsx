"use client";

import { useReducer, useState } from "react";
import { toast } from "sonner";
import { StepIndicator } from "./StepIndicator";
import { GarmentUploader } from "./GarmentUploader";
import { GarmentPreview } from "./GarmentPreview";
import { ModelSelector } from "./ModelSelector";
import { SessionConfigurator } from "./SessionConfigurator";
import { GenerationLoading } from "./GenerationLoading";
import { ResultViewer } from "./ResultViewer";
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];
type Garment = Database["public"]["Tables"]["garments"]["Row"];

interface StudioWizardProps {
  models: FashionModel[];
  garments: Garment[];
}

interface StudioState {
  step: number;
  garment: Garment | null;
  model: FashionModel | null;
  config: {
    pose?: string;
    lighting?: string;
    location?: string;
    accessory_set?: string;
    garment_description?: string;
    image_model?: string;
  };
  generationId: string | null;
  result: GenerationResult | null;
}

interface GenerationResult {
  id: string;
  status: string;
  outputs: Array<{
    id: string;
    image_url: string | null;
    angle: string | null;
  }>;
}

type StudioAction =
  | { type: "SET_GARMENT"; garment: Garment }
  | { type: "SET_MODEL"; model: FashionModel }
  | { type: "SET_CONFIG"; config: StudioState["config"] }
  | { type: "SET_GENERATION"; generationId: string }
  | { type: "SET_RESULT"; result: GenerationResult }
  | { type: "GO_TO_STEP"; step: number }
  | { type: "RESET" };

function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "SET_GARMENT":
      return { ...state, garment: action.garment, step: 2 };
    case "SET_MODEL":
      return { ...state, model: action.model, step: 3 };
    case "SET_CONFIG":
      return { ...state, config: action.config };
    case "SET_GENERATION":
      return { ...state, generationId: action.generationId, step: 4 };
    case "SET_RESULT":
      return { ...state, result: action.result, step: 5 };
    case "GO_TO_STEP":
      return { ...state, step: action.step };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const initialState: StudioState = {
  step: 1,
  garment: null,
  model: null,
  config: {},
  generationId: null,
  result: null,
};

const STEPS = [
  { label: "Garment", number: 1 },
  { label: "Model", number: 2 },
  { label: "Configure", number: 3 },
  { label: "Result", number: 4 },
];

export function StudioWizard({ models, garments }: StudioWizardProps) {
  const [state, dispatch] = useReducer(studioReducer, initialState);
  const [existingGarments, setExistingGarments] = useState<Garment[]>(garments);

  function handleGarmentUploaded(garment: Garment) {
    setExistingGarments((prev) => [garment, ...prev]);
    dispatch({ type: "SET_GARMENT", garment });
  }

  async function handleGenerate() {
    if (!state.garment || !state.model) return;

    const res = await fetch("/api/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_id: state.model.id,
        garment_id: state.garment.id,
        config: state.config,
        output_type: "image",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Insufficient credits");
      } else {
        toast.error(data.error ?? "Generation failed");
      }
      return;
    }

    const gen = await res.json();
    dispatch({ type: "SET_GENERATION", generationId: gen.id });

    pollGeneration(gen.id);
  }

  async function pollGeneration(id: string) {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/generations/${id}`);
      if (!res.ok) continue;

      const gen = await res.json();
      if (gen.status === "completed") {
        dispatch({
          type: "SET_RESULT",
          result: {
            id: gen.id,
            status: gen.status,
            outputs: gen.generated_outputs ?? [],
          },
        });
        toast.success("Generation complete!");
        return;
      }
      if (gen.status === "failed") {
        toast.error(gen.error_message ?? "Generation failed");
        dispatch({ type: "GO_TO_STEP", step: 3 });
        return;
      }
    }
    toast.error("Generation timed out");
    dispatch({ type: "GO_TO_STEP", step: 3 });
  }

  async function handleMultiAngle(angles: string[]) {
    if (!state.generationId) return;
    const res = await fetch(
      `/api/generations/${state.generationId}/multi-angle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angles, image_model: state.config.image_model }),
      },
    );
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Insufficient credits");
      } else {
        toast.error(data.error ?? "Multi-angle failed");
      }
      return;
    }
    const gen = await res.json();
    dispatch({ type: "SET_GENERATION", generationId: gen.id });
    toast.info(`Generating ${angles.length} angle${angles.length > 1 ? "s" : ""}...`);
    pollGeneration(gen.id);
  }

  async function handleRegen() {
    if (!state.generationId) return;
    const res = await fetch(
      `/api/generations/${state.generationId}/regen`,
      { method: "POST" },
    );
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Insufficient credits");
      } else {
        toast.error(data.error ?? "Re-generation failed");
      }
      return;
    }
    const gen = await res.json();
    dispatch({ type: "SET_GENERATION", generationId: gen.id });
    toast.info("Re-generating...");
    pollGeneration(gen.id);
  }

  return (
    <div className="space-y-6 p-6 md:p-10">
      <div>
        <h1 className="font-heading text-[22px] font-bold text-[#FAFAFA]">
          Studio
        </h1>
        <p className="mt-1 text-[13px] text-[#71717A]">
          Generate professional fashion photos
        </p>
      </div>

      <StepIndicator
        steps={STEPS}
        currentStep={state.step <= 3 ? state.step : 4}
      />

      {state.step === 1 && (
        <div className="grid gap-6 md:grid-cols-2">
          <GarmentUploader onUploaded={handleGarmentUploaded} />
          <GarmentPreview
            garments={existingGarments}
            selected={state.garment}
            onSelect={(g) => dispatch({ type: "SET_GARMENT", garment: g })}
            onDelete={(id) => {
              setExistingGarments((prev) => prev.filter((g) => g.id !== id));
              if (state.garment?.id === id) {
                dispatch({ type: "GO_TO_STEP", step: 1 });
              }
            }}
          />
        </div>
      )}

      {state.step === 2 && (
        <ModelSelector
          models={models}
          selected={state.model}
          onSelect={(m) => dispatch({ type: "SET_MODEL", model: m })}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: 1 })}
        />
      )}

      {state.step === 3 && (
        <SessionConfigurator
          garment={state.garment!}
          model={state.model!}
          config={state.config}
          onConfigChange={(config) => dispatch({ type: "SET_CONFIG", config })}
          onGenerate={handleGenerate}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: 2 })}
        />
      )}

      {state.step === 4 && <GenerationLoading />}

      {state.step === 5 && state.result && (
        <ResultViewer
          result={state.result}
          onMultiAngle={handleMultiAngle}
          onRegen={handleRegen}
          onNewGeneration={() => dispatch({ type: "RESET" })}
        />
      )}
    </div>
  );
}
