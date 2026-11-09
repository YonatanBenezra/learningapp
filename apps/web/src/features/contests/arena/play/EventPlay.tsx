"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { contestsApi } from "@/features/contests/contests-api";
import type { ArenaCategoryId } from "@/features/contests/arena/lib/categories";
import {
  activityFromLeaderboard,
  aroundYouFromLeaderboard,
} from "@/features/contests/arena/lib/play-leaderboard-rail";
import { buildPlayBoard, buildPlayHud } from "@/features/contests/arena/lib/play-mock";
import type { ActivityRow, AroundYouRow } from "@/features/contests/arena/lib/play-types";
import type { ContestDetail } from "@/types/contest";
import { ChallengeBoardTable } from "./challenge-table";
import { CategorySidebar } from "./category-sidebar";
import { ChallengeDrawer } from "./ChallengeDrawer";
import { MobileCategoryChips } from "./FilterSidebar";
import { OperatorAvatarCard } from "./operator-avatar-card";
import { OperatorRailPanel } from "./operator-rail-panel";
import { OperatorStatsRow } from "./operator-stats-row";
import { usePlayUrl } from "./use-play-url";
import {
  globalEventEnded,
  personalTimeEnded,
  scoringBannerMessage,
  scoringClosed,
} from "./play-contest-phase";
import "./play-category-sidebar.css";
import "./play-dashboard.css";
import "./play-htb.css";

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
  const [contest, setContest] = useState(initial);
  const { challengeId, setChallengeId, filters, setFilters } = usePlayUrl();
  const [around, setAround] = useState<AroundYouRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [rankDelta, setRankDelta] = useState(0);
  const prevRankRef = useRef<number | null>(null);
  const [railSheetOpen, setRailSheetOpen] = useState(false);

  const eventEnded = globalEventEnded(contest);
  const scoringOff = scoringClosed(contest);
  const personalOver = personalTimeEnded(contest);
  const board = useMemo(() => buildPlayBoard(contest), [contest]);
  const categoryCounts = useMemo(() => categoryCountsFromBoard(board), [board]);
  const selected = useMemo(
    () => (challengeId ? (board.find((c) => c.id === challengeId) ?? null) : null),
    [board, challengeId],
  );
  const hud = useMemo(() => buildPlayHud(contest, rank, rankDelta), [contest, rank, rankDelta]);
  const scoringBanner = scoringBannerMessage(contest);
  const virtualHref =
    contest.virtualPracticeAvailable && contest.problems[0]
      ? routes.contestPracticeProblem(contest.slug, contest.problems[0].slug)
      : null;

  const refreshContest = useCallback(async () => {
    try {
      const detail = await contestsApi.getBySlug(contest.slug);
      setContest(detail);
    } catch {
      /* keep last good snapshot */
    }
  }, [contest.slug]);

  const refreshBoard = useCallback(async () => {
    await refreshContest();
    try {
      const res = await contestsApi.leaderboard(contest.slug, 1, 50);
      const you = res.items.find((r) => r.isYou);
      if (you) {
        const prev = prevRankRef.current;
        if (prev != null && prev !== you.rank) {
          setRankDelta(prev - you.rank);
        }
        prevRankRef.current = you.rank;
        setRank(you.rank);
      } else if (res.total === 0) {
        setRank(null);
        prevRankRef.current = null;
        setRankDelta(0);
      }
      setAround(aroundYouFromLeaderboard(res.items, res.total));
      setActivity(activityFromLeaderboard(res.items));
    } catch {
      /* keep last good snapshot */
    }
  }, [contest.slug, refreshContest]);

  useEffect(() => {
    void refreshBoard();
    const id = window.setInterval(() => void refreshBoard(), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshBoard();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshBoard]);

  const setCategory = useCallback(
    (cat: ArenaCategoryId | "all") => {
      setFilters({ ...filters, category: cat });
    },
    [filters, setFilters],
  );

  return (
    <div className="arena-play min-h-full bg-[#0F1520] pb-10 text-[#A4B1CD]">
      {personalOver ? (
        <p className="border-b border-[#232C3D] bg-[#151C2B] py-2 text-center text-xs text-[#6B7891]">
          Your personal timer has ended — challenges may still be open for capture.
        </p>
      ) : null}

      {scoringBanner ? (
        <div className="border-b border-[#232C3D] bg-[#0F1520]/90">
          <div className="lp-play-container px-6 py-2 text-xs leading-relaxed text-[#6B7891]">
            {scoringBanner}{" "}
            {virtualHref ? (
              <Link href={virtualHref} className="font-medium text-[#9FEF00] hover:underline">
                Virtual practice
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <main className="lp-play-container mt-6 px-6">
        <MobileCategoryChips
          state={filters}
          onChange={setFilters}
          categoryCounts={categoryCounts}
        />

        <div className="play-layout-htb">
          <aside className="play-col-left hidden lg:block">
            <div className="sticky top-20">
              <OperatorAvatarCard />
              <CategorySidebar
                activeCategory={filters.category}
                categoryCounts={categoryCounts}
                onCategoryChange={setCategory}
              />
            </div>
          </aside>

          <div className="play-col-center min-w-0">
            <OperatorStatsRow hud={hud} />
            <ChallengeBoardTable
              board={board}
              filters={filters}
              onFiltersChange={setFilters}
              activeId={challengeId}
              onSelect={setChallengeId}
            />
          </div>

          <OperatorRailPanel
            around={around}
            activity={activity}
            contestSlug={contest.slug}
            className="play-col-right hidden xl:flex"
          />
        </div>

        <button
          type="button"
          className="fixed bottom-4 right-4 z-30 flex size-12 items-center justify-center rounded-full border border-[#2A3446] bg-[#151C2B] text-white shadow-lg xl:hidden"
          aria-label="Open activity panel"
          onClick={() => setRailSheetOpen(true)}
        >
          <span className="text-xs font-bold">Feed</span>
        </button>

        {railSheetOpen ? (
          <div
            className="fixed inset-0 z-50 bg-black/50 xl:hidden"
            role="presentation"
            onClick={() => setRailSheetOpen(false)}
          >
            <div
              className="absolute inset-x-0 bottom-4 top-16 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <OperatorRailPanel
                around={around}
                activity={activity}
                contestSlug={contest.slug}
                className="h-full max-h-none"
              />
            </div>
          </div>
        ) : null}
      </main>

      <ChallengeDrawer
        open={selected != null}
        challenge={selected}
        contest={contest}
        contestSlug={contest.slug}
        scoringClosed={scoringOff || eventEnded}
        onClose={() => setChallengeId(null)}
      />
    </div>
  );
}
