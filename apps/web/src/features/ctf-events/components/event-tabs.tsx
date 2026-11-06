"use client";

import type { CtfEventTab } from "@/features/ctf-events/types";
import { cn } from "@/lib/utils";

const TABS: { id: CtfEventTab; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "joined", label: "Joined" },
  { id: "past", label: "Past" },
];

type EventTabsProps = {
  tab: CtfEventTab;
  counts?: Record<CtfEventTab, number>;
  onTab: (tab: CtfEventTab) => void;
};

export function EventTabs({ tab, counts, onTab }: EventTabsProps) {
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
                "relative shrink-0 pb-1 text-sm font-medium tracking-[0.14px] transition-colors",
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
                  className="absolute -bottom-px left-1/2 h-0.5 w-[calc(100%+24px)] max-w-none -translate-x-1/2 bg-platform-accent"
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
