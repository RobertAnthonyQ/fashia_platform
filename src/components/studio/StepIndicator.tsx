"use client";

import { Check } from "lucide-react";

interface Step {
  label: string;
  number: number;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center justify-center pb-4"
      style={{ height: 48 }}
    >
      {steps.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isFuture = step.number > currentStep;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center shrink-0 rounded-full"
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor:
                    isCompleted || isActive ? "#BEFF00" : "#27272A",
                }}
              >
                {isCompleted ? (
                  <Check size={12} strokeWidth={3} color="#09090B" />
                ) : (
                  <span
                    className="font-bold"
                    style={{
                      fontSize: 12,
                      color: isFuture ? "#52525B" : "#09090B",
                    }}
                  >
                    {step.number}
                  </span>
                )}
              </div>

              <span
                className="hidden sm:inline"
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isCompleted
                    ? "#52525B"
                    : isActive
                      ? "#FAFAFA"
                      : "#52525B",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className="mx-1.5 sm:mx-3"
                style={{
                  width: 20,
                  height: 1,
                  backgroundColor: "#27272A",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
