"use client";

import type { Database } from "@/src/types/database";

type CreditLedger = Database["public"]["Tables"]["credit_ledger"]["Row"];

interface CreditHistoryProps {
  history: CreditLedger[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

export function CreditHistory({
  history,
  loading,
  hasMore,
  onLoadMore,
}: CreditHistoryProps) {
  if (!loading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#27272A] bg-[#18181B] py-16">
        <p className="text-[14px] text-[#52525B]">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#27272A] bg-[#18181B]">
      {/* Table header */}
      <div
        className="grid px-4 sm:px-5 items-center min-w-[500px]"
        style={{
          gridTemplateColumns: "110px 110px 1fr 80px",
          height: 40,
        }}
      >
        {["DATE", "TYPE", "DESCRIPTION", "AMOUNT"].map((col) => (
          <div key={col} className="text-[11px] font-semibold text-[#52525B]">
            {col}
          </div>
        ))}
      </div>

      <div className="h-px bg-[#27272A]" />

      {/* Data rows */}
      {history.map((entry, i) => (
        <div key={entry.id}>
          <div
            className="grid items-center px-4 sm:px-5 min-w-[500px]"
            style={{
              gridTemplateColumns: "110px 110px 1fr 80px",
              height: 44,
            }}
          >
            <span className="text-[13px] text-[#A1A1AA]">
              {entry.created_at ? formatDate(entry.created_at) : "—"}
            </span>

            <div className="flex items-center">
              <span className="inline-flex items-center rounded-[5px] bg-[#27272A] h-[22px] px-2 text-[11px] text-[#A1A1AA]">
                {formatType(entry.type)}
              </span>
            </div>

            <span className="truncate text-[13px] text-[#A1A1AA]">
              {entry.description ?? "—"}
            </span>

            <span
              className="text-right text-[13px] font-medium"
              style={{
                color: entry.amount > 0 ? "#4ADE80" : "#F87171",
              }}
            >
              {formatAmount(entry.amount)}
            </span>
          </div>

          {i < history.length - 1 && <div className="h-px bg-[#27272A]" />}
        </div>
      ))}

      {/* Loading skeleton */}
      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <div key={`skel-${i}`}>
            <div className="h-px bg-[#27272A]" />
            <div
              className="grid items-center px-5"
              style={{
                gridTemplateColumns: "140px 130px 1fr 90px",
                height: 44,
              }}
            >
              <div className="h-3 w-20 animate-pulse rounded bg-[#27272A]" />
              <div className="h-5 w-16 animate-pulse rounded bg-[#27272A]" />
              <div className="h-3 w-32 animate-pulse rounded bg-[#27272A]" />
              <div className="ml-auto h-3 w-10 animate-pulse rounded bg-[#27272A]" />
            </div>
          </div>
        ))}

      {/* Load more */}
      {hasMore && !loading && (
        <>
          <div className="h-px bg-[#27272A]" />
          <div className="flex justify-center py-3">
            <button
              onClick={onLoadMore}
              className="text-[13px] text-[#52525B] transition-colors hover:text-[#A1A1AA]"
            >
              Load more
            </button>
          </div>
        </>
      )}
    </div>
  );
}
