"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  credits: number;
  className?: string;
}

export function CreditBadge({ credits, className }: CreditBadgeProps) {
  const variant =
    credits === 0
      ? "bg-red-900/50 text-red-400"
      : credits < 10
        ? "bg-yellow-900/50 text-yellow-400"
        : "bg-zinc-800 text-zinc-200";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        variant,
        className,
      )}
    >
      <Zap className="h-3.5 w-3.5" />
      <span>{credits}</span>
    </div>
  );
}
