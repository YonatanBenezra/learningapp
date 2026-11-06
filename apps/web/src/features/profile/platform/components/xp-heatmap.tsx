"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { XpDay } from "@/features/profile/platform/types";
import { cn } from "@/lib/utils";

type XpHeatmapProps = {
  days: XpDay[];
  className?: string;
};

function weekColumns(days: XpDay[]) {
  const weeks: XpDay[][] = [];
  let week: XpDay[] = [];
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);
  return weeks;
}

function xpLevel(xp: number): 0 | 1 | 2 | 3 {
  if (xp <= 0) return 0;
  if (xp < 15) return 1;
  if (xp < 50) return 2;
  return 3;
}

const LEVEL_CLASS: Record<number, string> = {
  0: "bg-platform-input",
  1: "bg-[rgb(159_239_0/0.45)]",
  2: "bg-[rgb(159_239_0/0.7)]",
  3: "bg-platform-accent",
};

function formatWeekTooltip(week: XpDay[]) {
  if (week.length === 0) return "";
  const start = new Date(week[0].date);
  const end = new Date(week[week.length - 1].date);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const total = week.reduce((s, d) => s + d.xp, 0);
  return `${fmt(start)} – ${fmt(end)}: ${total} XP`;
}

export function XpHeatmap({ days, className }: XpHeatmapProps) {
  const weeks = useMemo(() => weekColumns(days), [days]);
  const flat = useMemo(() => weeks.flat(), [weeks]);
  const [focusIndex, setFocusIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let last = "";
    weeks.forEach((week, wi) => {
      const d = week[0];
      if (!d) return;
      const m = new Date(d.date).toLocaleDateString("en-US", { month: "short" });
      if (m !== last) {
        labels.push({ label: m, col: wi });
        last = m;
      }
    });
    return labels;
  }, [weeks]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const cols = weeks.length;
      const col = Math.floor(focusIndex / 7);
      const row = focusIndex % 7;
      let next = focusIndex;
      if (e.key === "ArrowRight") next = Math.min(flat.length - 1, focusIndex + 7);
      if (e.key === "ArrowLeft") next = Math.max(0, focusIndex - 7);
      if (e.key === "ArrowDown") next = Math.min(flat.length - 1, (col + 1) * 7 + row);
      if (e.key === "ArrowUp") next = Math.max(0, (col - 1) * 7 + row);
      if (next !== focusIndex) {
        e.preventDefault();
        setFocusIndex(next);
        gridRef.current?.querySelectorAll<HTMLElement>("[data-cell]")[next]?.focus();
      }
    },
    [flat.length, focusIndex, weeks.length],
  );

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div
        className="mb-2 grid gap-[3px] text-[10px] font-medium text-platform-muted"
        style={{
          gridTemplateColumns: `repeat(${weeks.length}, 12px)`,
          fontFamily: "var(--font-roboto-mono)",
        }}
        aria-hidden
      >
        {monthLabels.map((m) => (
          <span key={`${m.label}-${m.col}`} style={{ gridColumn: m.col + 1 }}>
            {m.label}
          </span>
        ))}
      </div>
      <div
        ref={gridRef}
        role="grid"
        aria-label="XP activity in the last year"
        className="grid auto-cols-[12px] grid-flow-col gap-[3px] outline-none"
        style={{ gridTemplateRows: "repeat(7, 12px)" }}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const idx = di * weeks.length + wi;
            const level = xpLevel(day.xp);
            const isToday = day.date === new Date().toISOString().slice(0, 10);
            return (
              <button
                key={day.date}
                type="button"
                data-cell
                role="gridcell"
                aria-label={`${day.date}: ${day.xp} XP`}
                title={`${day.date}: ${day.xp} XP`}
                className={cn(
                  "size-3 rounded-[3px] transition-shadow duration-150 hover:ring-2 hover:ring-platform-accent/40 focus:ring-2 focus:ring-platform-accent",
                  LEVEL_CLASS[level],
                  isToday && "ring-1 ring-platform-text/50",
                )}
                onFocus={() => setFocusIndex(idx)}
              />
            );
          }),
        )}
      </div>
      <p className="sr-only">{formatWeekTooltip(weeks[weeks.length - 1] ?? [])}</p>
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-platform-muted">
        <span>Less</span>
        {[0, 1, 2, 3].map((l) => (
          <span key={l} className={cn("size-3 rounded-[3px]", LEVEL_CLASS[l])} aria-hidden />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
