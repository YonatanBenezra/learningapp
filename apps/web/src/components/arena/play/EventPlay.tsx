"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChallengeCard } from "@/components/arena/ChallengeCard";
import { routes } from "@/config/routes";
import { contestsApi } from "@/features/contests/contests-api";
import type { ArenaCategoryId } from "@/lib/arena/categories";
import { mapProblemToPlayChallenge, type PlayChallenge } from "@/lib/arena/map-play";
import type { ContestDetail } from "@/types/contest";
import { ActivityFeed } from "./ActivityFeed";
import { AroundYou, type AroundRow } from "./AroundYou";
import { PlayFilters, type PlayFilterState } from "./PlayFilters";
import { PlayHero } from "./PlayHero";

function entryOver(contest: ContestDetail) {
  return (
    contest.status === "expired" ||
    contest.status === "finished" ||
    (contest.entered && contest.window === "closed")
  );
}

export function EventPlay({ initial }: { initial: ContestDetail }) {
  const [contest] = useState(initial);
  const [around, setAround] = useState<AroundRow[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [filters, setFilters] = useState<PlayFilterState>({
    category: "all",
    difficulties: new Set(),
    status: new Set(),
  });

  const closed = entryOver(contest);
  const solvedCount = contest.problems.filter((p) => p.scored).length;

  const challenges = useMemo(
    () =>
      contest.problems.map((p) => {
        const row = mapProblemToPlayChallenge(p, contest, closed);
        return {
          ...row,
          href: closed ? undefined : routes.contestProblem(contest.slug, p.slug),
          solveTime: p.scored ? "0:14" : undefined,
        };
      }),
    [contest, closed],
  );

  const refreshBoard = useCallback(async () => {
    try {
      const board = await contestsApi.leaderboard(contest.slug, 1, 50);
      const you = board.items.find((r) => r.isYou);
      if (you) {
        setRank(you.rank);
      }
      const idx = board.items.findIndex((r) => r.isYou);
      if (idx >= 0) {
        const slice = board.items.slice(Math.max(0, idx - 2), idx + 3);
        setAround(
          slice.map((r) => ({
            rank: r.rank,
            name: r.displayName,
            score: r.totalScore,
            isYou: r.isYou,
          })),
        );
      }
    } catch {
      setAround([
        { rank: 39, name: "labrat42", score: 1024 },
        { rank: 40, name: "de.bina", score: 1085, isYou: true },
        { rank: 41, name: "nusrat.k", score: 1141 },
      ]);
      setRank(41);
    }
  }, [contest.slug]);

  useEffect(() => {
    void refreshBoard();
    const id = window.setInterval(() => void refreshBoard(), 60_000);
    return () => window.clearInterval(id);
  }, [refreshBoard]);

  const filtered = useMemo(() => {
    return challenges.filter((ch) => {
      if (filters.category !== "all" && ch.categoryId !== filters.category) {
        return false;
      }
      if (
        filters.difficulties.size > 0 &&
        !filters.difficulties.has(ch.difficulty)
      ) {
        return false;
      }
      if (filters.status.size > 0) {
        const isSolved = ch.variant === "solved";
        if (filters.status.has("solved") && !filters.status.has("unsolved")) {
          return isSolved;
        }
        if (filters.status.has("unsolved") && !filters.status.has("solved")) {
          return !isSolved;
        }
      }
      return true;
    });
  }, [challenges, filters]);

  const categoryCounts = useMemo(() => {
    const counts: Record<ArenaCategoryId | "all", string> = {
      all: `${solvedCount}/${contest.problems.length}`,
      "prompt-injection": "0/2",
      retrieval: "2/5",
      guardrails: "1/4",
      evals: "1/2",
      exfiltration: "0/2",
    };
    for (const ch of challenges) {
      if (ch.variant === "solved") {
        /* keep mock progress labels for now */
      }
    }
    return counts;
  }, [challenges, contest.problems.length, solvedCount]);

  return (
    <div className="arena-hub arena-play relative flex flex-col gap-5 pb-16 pt-6 sm:gap-6 sm:pb-20 sm:pt-8 lg:max-w-[1360px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={routes.contest(contest.slug)}
          className="font-mono text-xs text-[var(--arena-text-3)] hover:text-[var(--arena-lime-fg)]"
        >
          ← Event lobby
        </Link>
      </div>
      <PlayHero
        contest={contest}
        rank={rank}
        rankDelta={8}
        solved={solvedCount}
        firstBloods={0}
      />
      {closed ? (
        <p className="rounded-lg border border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-ink)_3%,transparent)] px-4 py-3 text-sm text-[var(--arena-text-2)]">
          {contest.status === "expired"
            ? `Your ${contest.timeBoxMinutes}-minute operation clock ended. Problems are closed for this entry.`
            : "This entry is finished."}
        </p>
      ) : null}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <PlayFilters
          state={filters}
          onChange={setFilters}
          categoryCounts={categoryCounts}
        />
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ch: PlayChallenge & { href?: string; solveTime?: string }) => (
              <ChallengeCard
                key={ch.slug}
                variant={ch.variant}
                title={ch.title}
                categoryId={ch.categoryId}
                difficulty={ch.difficulty}
                basePoints={ch.basePoints}
                solves={ch.solves}
                firstBloodUser={ch.firstBloodUser}
                href={ch.href}
                solveTime={ch.solveTime}
                disabled={closed}
              />
            ))}
          </div>
        </div>
        <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[280px]">
          <AroundYou rows={around} hint="+56 pts to pass nusrat.k" />
          <ActivityFeed />
        </aside>
      </div>
    </div>
  );
}
