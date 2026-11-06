"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  computeXpStats,
  groupWeeksByMonth,
  weekRangeLabel,
  xpBarColor,
  type XpWeek,
} from "@/features/profile/platform/xp-weeks-utils";
import { cn } from "@/lib/utils";

export type XpActivityCardProps = {
  brand: string;
  weeks: XpWeek[];
  className?: string;
};

export function XpActivityCard({ brand, weeks, className }: XpActivityCardProps) {
  const columns = useMemo(() => groupWeeksByMonth(weeks), [weeks]);
  const flatBars = useMemo(() => columns.flatMap((c) => c.weeks), [columns]);
  const stats = useMemo(() => computeXpStats(weeks), [weeks]);
  const totalYearXp = useMemo(() => weeks.reduce((s, w) => s + w.xp, 0), [weeks]);

  const [focusIndex, setFocusIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const barRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusBar = useCallback((index: number) => {
    const next = Math.max(0, Math.min(flatBars.length - 1, index));
    setFocusIndex(next);
    barRefs.current[next]?.focus();
  }, [flatBars.length]);

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (flatBars.length === 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBar(focusIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBar(focusIndex - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusBar(focusIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusBar(focusIndex - 1);
    }
  };

  let barCursor = 0;

  return (
    <section
      className={cn(
        "lp-xp-activity-card w-full max-w-[760px] rounded-lg border border-[#1E2939] bg-transparent p-4",
        className,
      )}
    >
      <h2 className="mb-6 text-base font-semibold leading-snug text-[#F4F4F4]">
        <span className="text-[#9FEF00]" style={{ fontFamily: "var(--font-roboto-mono, monospace)" }}>
          {totalYearXp.toLocaleString()} XP
        </span>{" "}
        gained on {brand} in the last year
      </h2>

      <div
        className="outline-none"
        role="group"
        aria-label="Weekly XP activity by month"
        tabIndex={0}
        onKeyDown={onGridKeyDown}
      >
        <div className="grid grid-cols-12 gap-1">
          {columns.map((col) => (
            <div key={col.label} className="flex min-w-0 flex-col items-stretch">
              <p className="mb-5 text-center text-xs text-[#8799B5]">{col.label}</p>
              <div className="flex flex-col gap-1.5">
                {col.weeks.map((week) => {
                  const idx = barCursor;
                  barCursor += 1;
                  const range = weekRangeLabel(week.start);
                  const label = `${range}: ${week.xp} XP earned`;
                  const showTip = hoverIndex === idx || focusIndex === idx;

                  return (
                    <div key={week.start} className="relative">
                      <button
                        ref={(el) => {
                          barRefs.current[idx] = el;
                        }}
                        type="button"
                        className="h-[11px] w-full rounded-[3px] transition-opacity duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9FEF00]/50"
                        style={{ backgroundColor: xpBarColor(week.xp) }}
                        aria-label={label}
                        onFocus={() => setFocusIndex(idx)}
                        onMouseEnter={() => setHoverIndex(idx)}
                        onMouseLeave={() => setHoverIndex(null)}
                      />
                      {showTip ? (
                        <div
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0B121D] px-2 py-1 text-xs text-white shadow-lg"
                        >
                          {label}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Weekly Average", value: `${stats.weeklyAverage} XP` },
          { label: "Total XP", value: stats.total.toLocaleString() },
          { label: "Weeks Active", value: `${stats.weeksActive} weeks` },
        ].map((item) => (
          <div
            key={item.label}
            className="flex h-[84px] flex-col justify-center rounded-md border border-[#1E2939] px-4 py-5"
          >
            <p className="text-sm text-[#8799B5]">{item.label}</p>
            <p className="mt-1.5 text-lg font-semibold text-[#F4F4F4]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
