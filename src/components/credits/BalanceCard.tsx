"use client";

import Link from "next/link";

interface BalanceCardProps {
  credits: number;
  plan: string;
}

export function BalanceCard({ credits, plan }: BalanceCardProps) {
  const isPro = plan?.toLowerCase() === "pro";

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 rounded-2xl px-5 py-5 sm:px-10"
      style={{
        minHeight: 120,
        backgroundColor: "#18181B",
        border: "1px solid #BEFF0040",
        boxShadow: "0 0 32px 0 #BEFF0015",
      }}
    >
      {/* Left side */}
      <div className="flex flex-col">
        <span className="font-heading text-[40px] sm:text-[56px] font-bold leading-none text-[#FAFAFA]">
          {credits}
        </span>
        <span className="mt-1 text-[13px] sm:text-[14px] text-[#71717A]">
          credits remaining
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center sm:flex-col sm:items-end gap-3">
        {isPro && (
          <span className="inline-flex items-center justify-center rounded-lg h-[28px] px-3 bg-[#BEFF00] text-[12px] font-bold text-[#09090B]">
            PRO
          </span>
        )}
        <Link
          href="/credits/buy"
          className="inline-flex items-center justify-center gap-2 rounded-[10px] h-[38px] sm:h-[42px] px-4 sm:px-5 bg-[#BEFF00] text-[13px] sm:text-[14px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity"
        >
          <span>⚡</span>
          <span>Buy Credits</span>
        </Link>
      </div>
    </div>
  );
}
