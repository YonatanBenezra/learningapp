"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlaySort = "points" | "title" | "difficulty";

export function PlayChallengeToolbar({
  total,
  query,
  onQueryChange,
  sort,
  onSortChange,
  className,
}: {
  total: number;
  query: string;
  onQueryChange: (q: string) => void;
  sort: PlaySort;
  onSortChange: (s: PlaySort) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <h2 className="flex items-baseline gap-2 text-[15px] font-semibold text-[var(--arena-ink)]">
        Challenges
        <span className="font-mono text-sm font-bold text-[var(--arena-text-3)]">{total}</span>
      </h2>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-lg sm:flex-row sm:justify-end">
        <label className="relative min-w-0 flex-1 sm:max-w-[240px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--arena-text-3)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search challenges"
            className="h-9 w-full rounded-lg border border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-ink)_4%,transparent)] py-0 pl-9 pr-3 text-[13px] text-[var(--arena-ink)] outline-none placeholder:text-[var(--arena-text-3)] focus:border-[color-mix(in_srgb,var(--arena-lime)_35%,var(--arena-line))]"
          />
        </label>
        <label className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-[var(--arena-text-3)]">
          Sort:
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as PlaySort)}
            className="h-9 min-w-[108px] cursor-pointer rounded-lg border border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-ink)_4%,transparent)] px-2.5 text-[12px] text-[var(--arena-ink)] outline-none focus:border-[color-mix(in_srgb,var(--arena-lime)_35%,var(--arena-line))]"
          >
            <option value="points">Points</option>
            <option value="title">Title</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </label>
      </div>
    </div>
  );
}
