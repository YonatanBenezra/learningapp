"use client";

import { Search } from "lucide-react";
import { ChallengeCard } from "@/components/arena/ChallengeCard";
import type { PlayBoardChallenge } from "@/lib/arena/play-types";
import type { PlayFilterState } from "./FilterSidebar";

const DIFF_ORDER: Record<string, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  Insane: 3,
};

export function filterAndSortChallenges(
  board: PlayBoardChallenge[],
  filters: PlayFilterState,
): PlayBoardChallenge[] {
  const q = filters.query.trim().toLowerCase();
  let list = board.filter((ch) => {
    if (filters.category !== "all" && ch.categoryId !== filters.category) {
      return false;
    }
    if (filters.difficulties.size > 0 && !filters.difficulties.has(ch.difficulty)) {
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
    if (q && !ch.title.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  list = [...list];
  list.sort((a, b) => {
    if (filters.sort === "newest") {
      return a.title.localeCompare(b.title);
    }
    if (filters.sort === "difficulty") {
      return DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty];
    }
    if (filters.sort === "solves") {
      return b.solves - a.solves;
    }
    return b.currentPoints - a.currentPoints;
  });
  return list;
}

export function ChallengeGrid({
  board,
  filters,
  onFiltersChange,
  activeId,
  onSelect,
  clockExpired,
}: {
  board: PlayBoardChallenge[];
  filters: PlayFilterState;
  onFiltersChange: (f: PlayFilterState) => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  clockExpired: boolean;
}) {
  const filtered = filterAndSortChallenges(board, filters);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-baseline gap-2 text-lg font-bold text-[var(--arena-ink)]">
          Challenges
          <span className="font-mono text-[13px] font-semibold text-[var(--arena-text-3)]">
            {board.length}
          </span>
        </h2>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:justify-end">
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--arena-text-3)]"
              aria-hidden
            />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
              placeholder="Search challenges"
              className="h-9 w-full rounded-md border border-[var(--arena-line-2)] bg-transparent py-0 pl-9 pr-3 text-[13px] text-[var(--arena-ink)] outline-none placeholder:text-[var(--arena-text-3)]"
            />
          </label>
          <label className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-[var(--arena-text-3)]">
            Sort:
            <select
              value={filters.sort}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sort: e.target.value as PlayFilterState["sort"],
                })
              }
              className="h-9 cursor-pointer rounded-md border border-[var(--arena-line-2)] bg-transparent px-2 text-[12px] text-[var(--arena-ink)]"
            >
              <option value="points">Points</option>
              <option value="solves">Solves</option>
              <option value="difficulty">Difficulty</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
      </div>

      <div className="play-challenge-grid">
        {filtered.map((ch) => (
          <ChallengeCard
            key={ch.id}
            play
            active={activeId === ch.id}
            variant={ch.variant}
            title={ch.title}
            categoryId={ch.categoryId}
            difficulty={ch.difficulty}
            basePoints={ch.base}
            solves={ch.solves}
            firstBloodUser={ch.firstBlood?.user}
            solveTime={ch.solveTime}
            attemptTries={ch.attemptTries}
            disabled={clockExpired}
            onPreview={() => onSelect(ch.id)}
          />
        ))}
      </div>
    </div>
  );
}
