"use client";

import { useCallback, useEffect, useState } from "react";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestDetail } from "@/types/contest";

export function useContestOperatorStats(contestSlug: string, enabled: boolean) {
  const [contestDetail, setContestDetail] = useState<ContestDetail | null>(null);
  const [operatorRank, setOperatorRank] = useState<number | null>(null);

  const refreshOperatorStats = useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      const [detail, board] = await Promise.all([
        contestsApi.getBySlug(contestSlug),
        contestsApi.leaderboard(contestSlug, 1, 50),
      ]);
      setContestDetail(detail);
      setOperatorRank(board.items.find((row) => row.isYou)?.rank ?? null);
    } catch {
      /* keep last stats */
    }
  }, [contestSlug, enabled]);

  useEffect(() => {
    void refreshOperatorStats();
  }, [refreshOperatorStats]);

  return {
    contestDetail,
    setContestDetail,
    operatorRank,
    setOperatorRank,
    refreshOperatorStats,
  };
}
