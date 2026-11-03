"use client";

import type { PracticeTab } from "@/features/practice-hub/types";
import { cn } from "@/lib/utils";

const TABS: { id: PracticeTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rag", label: "RAG" },
  { id: "guardrails", label: "Guardrails" },
  { id: "todo", label: "To do" },
  { id: "solved", label: "Solved" },
];

type ProblemTabsProps = {
  tab: PracticeTab;
  counts?: Record<PracticeTab, number>;
  onTab: (tab: PracticeTab) => void;
};

export function ProblemTabs({ tab, counts, onTab }: ProblemTabsProps) {
  return (
    <div className="border-b border-platform-border">
      <div
        className="flex h-[68px] items-center gap-[34px] overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "lp-practice-hub-tab relative shrink-0 pb-1 font-semibold tracking-[0.01em] transition-colors",
                active ? "text-platform-text" : "text-platform-muted hover:text-platform-text",
              )}
              onClick={() => onTab(item.id)}
            >
              {item.label}
              {counts ? (
                <span className="ml-1.5 font-normal tabular-nums text-platform-muted">
                  {counts[item.id]}
                </span>
              ) : null}
              {active ? (
                <span
                  className="absolute -bottom-px left-1/2 h-0.5 w-[calc(100%+24px)] -translate-x-1/2 bg-platform-accent"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
