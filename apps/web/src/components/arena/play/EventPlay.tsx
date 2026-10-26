"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { contestsApi } from "@/features/contests/contests-api";
import type { ArenaCategoryId } from "@/lib/arena/categories";
import {
  buildPlayBoard,
  buildPlayHud,
  MOCK_ACTIVITY,
  MOCK_AROUND_YOU,
} from "@/lib/arena/play-mock";
import type { ActivityRow, AroundYouRow } from "@/lib/arena/play-types";
import type { ContestDetail } from "@/types/contest";
import { ActivityFeed } from "./ActivityFeed";
import { AroundYou } from "./AroundYou";
import { ChallengeDrawer } from "./ChallengeDrawer";
import { ChallengeGrid } from "./ChallengeGrid";
import { FilterSidebar } from "./FilterSidebar";
import { OperatorHud, useWindowEndsLabel } from "./OperatorHud";
import { usePlayUrl } from "./use-play-url";
import "./operator-hud.css";
import "./play-dashboard.css";

function entryOver(contest: ContestDetail) {
  return (
    contest.status === "expired" ||
    contest.status === "finished" ||
    (contest.entered && contest.window === "closed")
  );
}

function categoryCountsFromBoard(
  board: ReturnType<typeof buildPlayBoard>,
): Record<ArenaCategoryId | "all", string> {
  const solvedByCat: Partial<Record<ArenaCategoryId, number>> = {};
  const totalByCat: Partial<Record<ArenaCategoryId, number>> = {};
  for (const ch of board) {
    totalByCat[ch.categoryId] = (totalByCat[ch.categoryId] ?? 0) + 1;
    if (ch.variant === "solved") {
      solvedByCat[ch.categoryId] = (solvedByCat[ch.categoryId] ?? 0) + 1;
    }
  }
  const solvedTotal = board.filter((c) => c.variant === "solved").length;
  return {
    all: `${solvedTotal}/${board.length}`,
    "prompt-injection": `${solvedByCat["prompt-injection"] ?? 0}/${totalByCat["prompt-injection"] ?? 0}`,
    retrieval: `${solvedByCat.retrieval ?? 0}/${totalByCat.retrieval ?? 0}`,
    guardrails: `${solvedByCat.guardrails ?? 0}/${totalByCat.guardrails ?? 0}`,
    evals: `${solvedByCat.evals ?? 0}/${totalByCat.evals ?? 0}`,
    exfiltration: `${solvedByCat.exfiltration ?? 0}/${totalByCat.exfiltration ?? 0}`,
  };
}

export function EventPlay({ initial }: { initial: ContestDetail }) {
  const [contest] = useState(initial);
  const { challengeId, setChallengeId, filters, setFilters } = usePlayUrl();
  const [around, setAround] = useState<AroundYouRow[]>(MOCK_AROUND_YOU);
  const [activity] = useState<ActivityRow[]>(MOCK_ACTIVITY);
  const [rank, setRank] = useState<number | null>(41);
  const [rankDelta, setRankDelta] = useState(8);

  const closed = entryOver(contest);
  const board = useMemo(() => buildPlayBoard(contest), [contest]);
  const categoryCounts = useMemo(() => categoryCountsFromBoard(board), [board]);
  const selected = useMemo(
    () => (challengeId ? board.find((c) => c.id === challengeId) ?? null : null),
    [board, challengeId],
  );
  const windowLabel = useWindowEndsLabel(contest);
  const hud = useMemo(() => buildPlayHud(contest, rank, rankDelta), [contest, rank, rankDelta]);

  const refreshBoard = useCallback(async () => {
    try {
      const res = await contestsApi.leaderboard(contest.slug, 1, 50);
      const you = res.items.find((r) => r.isYou);
      if (you) {
        setRank(you.rank);
      }
      const idx = res.items.findIndex((r) => r.isYou);
      if (idx >= 0) {
        setAround(
          res.items.slice(Math.max(0, idx - 2), idx + 3).map((r) => ({
            rank: r.rank,
            name: r.displayName,
            score: r.totalScore,
            isYou: r.isYou,
          })),
        );
      }
    } catch {
      setAround(MOCK_AROUND_YOU);
      setRank(41);
      setRankDelta(8);
    }
  }, [contest.slug]);

  useEffect(() => {
    void refreshBoard();
    const id = window.setInterval(() => void refreshBoard(), 30_000);
    return () => window.clearInterval(id);
  }, [refreshBoard]);

  return (
    <div className="arena-hub arena-play relative flex flex-col gap-5 pb-20 pt-10">
      <OperatorHud contest={contest} hud={hud} windowEndsLabel={windowLabel} />

      <div className="play-layout">
        <FilterSidebar
          state={filters}
          onChange={setFilters}
          categoryCounts={categoryCounts}
        />

        <ChallengeGrid
          board={board}
          filters={filters}
          onFiltersChange={setFilters}
          activeId={challengeId}
          onSelect={setChallengeId}
          clockExpired={closed}
        />

        <aside className="play-rail flex flex-col gap-[18px]">
          <AroundYou rows={around} contestSlug={contest.slug} />
          <ActivityFeed items={activity} />
        </aside>
      </div>

      <ChallengeDrawer
        open={selected != null}
        challenge={selected}
        contest={contest}
        contestSlug={contest.slug}
        clockExpired={closed}
        onClose={() => setChallengeId(null)}
      />
    </div>
  );
}
