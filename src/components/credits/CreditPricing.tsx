"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BuyCreditsSection } from "./BuyCreditsSection";

export function CreditPricing() {

  return (
    <div className="flex flex-col gap-5 sm:gap-6 px-4 py-6 sm:px-10 sm:py-8 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/credits"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:bg-[#27272A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-heading text-[22px] font-bold text-[#FAFAFA]">
          Buy Credits
        </h1>
      </div>

      <BuyCreditsSection />
    </div>
  );
}

// dead code removed — all logic moved to BuyCreditsSection.tsx
