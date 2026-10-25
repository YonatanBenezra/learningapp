"use client";

import { Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ArenaTab } from "@/lib/arena/types";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<ArenaTab, string> = {
  live: "Live",
  upcoming: "Upcoming",
  archived: "Archived",
  my: "My events",
};

export function EventTabs({
  tab,
  counts,
  query,
  onTab,
  onQuery,
}: {
  tab: ArenaTab;
  counts: Record<ArenaTab, number>;
  query: string;
  onTab: (tab: ArenaTab) => void;
  onQuery: (q: string) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--arena-line)] sm:flex-row sm:items-end sm:justify-between">
      <div
        className="arena-tabs-scroll relative flex gap-4 overflow-x-auto pb-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filter events"
      >
        {(Object.keys(TAB_LABELS) as ArenaTab[]).map((id) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "relative shrink-0 pb-3 text-sm transition-colors",
                active
                  ? "font-semibold text-[var(--arena-ink)]"
                  : "font-medium text-[var(--arena-text-2)]",
              )}
              onClick={() => onTab(id)}
            >
              {TAB_LABELS[id]}{" "}
              <span
                className={cn(
                  "font-mono text-[11.5px] font-semibold",
                  active ? "text-[var(--arena-lime-fg)]" : "text-[var(--arena-text-3)]",
                )}
              >
                {counts[id]}
              </span>
              {active && !reduce ? (
                <motion.span
                  layoutId="arena-tab-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--arena-lime-fg)]"
                />
              ) : active ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--arena-lime-fg)]" />
              ) : null}
            </button>
          );
        })}
      </div>
      <label className="mb-3 flex w-full shrink-0 items-center gap-2 rounded-md border border-[var(--arena-line-2)] px-3 py-2 sm:mb-2 sm:w-[150px]">
        <Search className="size-3.5 shrink-0 text-[var(--arena-text-3)]" aria-hidden />
        <span className="sr-only">Search events</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search events"
          className="w-full border-none bg-transparent text-[12.5px] text-[var(--arena-ink)] outline-none placeholder:text-[var(--arena-text-3)]"
        />
      </label>
    </div>
  );
}
