"use client";

import { useState, useCallback } from "react";
import type { Database } from "@/src/types/database";
import { BalanceCard } from "./BalanceCard";
import { CostReference } from "./CostReference";
import { CreditHistory } from "./CreditHistory";

type CreditLedger = Database["public"]["Tables"]["credit_ledger"]["Row"];

interface CreditsPageClientProps {
  credits: number;
  plan: string;
  initialHistory: CreditLedger[];
  totalHistory: number;
}

const PAGE_SIZE = 20;

export function CreditsPageClient({
  credits,
  plan,
  initialHistory,
  totalHistory,
}: CreditsPageClientProps) {
  const [history, setHistory] = useState<CreditLedger[]>(initialHistory);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const hasMore = history.length < totalHistory;

  const handleLoadMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/credits/history?page=${nextPage}&limit=${PAGE_SIZE}`,
      );
      if (res.ok) {
        const data = await res.json();
        setHistory((prev) => [...prev, ...data.history]);
        setPage(nextPage);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 px-4 py-6 sm:px-10 sm:py-8 min-h-full">
      {/* Header */}
      <h1 className="font-heading text-[22px] font-bold text-[#FAFAFA] h-[44px] leading-[44px]">
        Credits
      </h1>

      {/* Balance Card */}
      <BalanceCard credits={credits} plan={plan} />

      {/* Cost Reference */}
      <CostReference />

      {/* Transaction History Title */}
      <h2 className="font-heading text-[16px] font-semibold text-[#FAFAFA]">
        Transaction History
      </h2>

      {/* Transaction Table */}
      <CreditHistory
        history={history}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
