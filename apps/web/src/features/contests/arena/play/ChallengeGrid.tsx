"use client";

import { Flag, LayoutGrid, List, Search } from "lucide-react";
import { useState } from "react";
import { ARENA_CATEGORIES } from "@/features/contests/arena/lib/categories";
import type { PlayBoardChallenge } from "@/features/contests/arena/lib/play-types";
import { cn } from "@/lib/utils";
import { defaultPlayFilters, type PlayFilterState } from "./FilterSidebar";
import { PlayChallengeCard, PlayChallengeListRow } from "./PlayChallengeCard";

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
    if (q) {
      const meta = ARENA_CATEGORIES[ch.categoryId];
      const hay = `${ch.title} ${meta.name}`.toLowerCase();
      if (!hay.includes(q)) {
        return false;
      }
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
}: {
  board: PlayBoardChallenge[];
  filters: PlayFilterState;
  onFiltersChange: (f: PlayFilterState) => void;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const filtered = filterAndSortChallenges(board, filters);
  const hasActiveFilters =
    filters.category !== "all" ||
    filters.difficulties.size > 0 ||
    filters.status.size > 0 ||
    filters.query.trim().length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          Challenges
          <span className="rounded border border-[#232C3D] px-2 py-0.5 font-mono text-xs text-[#6B7891]">
            {filtered.length}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative w-full min-w-[200px] sm:w-[280px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7891]"
              aria-hidden
            />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
              placeholder="Search challenges"
              className="h-10 w-full rounded-sm border border-[#2A3446] bg-transparent py-0 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[#6B7891] focus:border-[#9FEF00]"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-[#6B7891]">
            <span className="sr-only">Sort by</span>
            <select
              value={filters.sort}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sort: e.target.value as PlayFilterState["sort"],
                })
              }
              className="h-10 cursor-pointer rounded-sm border border-[#2A3446] bg-[#151C2B] px-3 text-sm text-[#A4B1CD] outline-none focus:border-[#9FEF00]"
            >
              <option value="points">Points</option>
              <option value="solves">Solves</option>
              <option value="newest">Name</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </label>
          <div className="flex rounded-sm border border-[#2A3446] p-0.5" role="group" aria-label="View mode">
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={cn(
                "rounded-sm p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FEF00]/40",
                view === "grid" ? "bg-[#18202F] text-white" : "text-[#6B7891] hover:text-[#A4B1CD]",
              )}
            >
              <LayoutGrid className="size-4" aria-hidden />
              <span className="sr-only">Grid view</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={cn(
                "rounded-sm p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FEF00]/40",
                view === "list" ? "bg-[#18202F] text-white" : "text-[#6B7891] hover:text-[#A4B1CD]",
              )}
            >
              <List className="size-4" aria-hidden />
              <span className="sr-only">List view</span>
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-sm border border-[#232C3D] bg-[#18202F] px-6 py-16 text-center">
          <Flag className="size-10 text-[#6B7891]" aria-hidden />
          <p className="text-[#A4B1CD]">No challenges match your filters</p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => onFiltersChange(defaultPlayFilters())}
              className="rounded-sm border border-[#2A3446] px-4 py-2 text-sm text-white transition-colors hover:border-[#9FEF00]/50 hover:text-[#9FEF00]"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : view === "grid" ? (
        <div className="play-challenge-grid">
          {filtered.map((ch) => (
            <PlayChallengeCard
              key={ch.id}
              challenge={ch}
              active={activeId === ch.id}
              onSelect={() => onSelect(ch.id)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-[#232C3D] bg-[#18202F]">
          {filtered.map((ch) => (
            <PlayChallengeListRow
              key={ch.id}
              challenge={ch}
              active={activeId === ch.id}
              onSelect={() => onSelect(ch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
