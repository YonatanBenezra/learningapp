"use client";

import type { ScoreboardEntry } from "../types";

type ChartLegendProps = {
  operators: (ScoreboardEntry & { color: string })[];
  hidden: Set<string>;
  highlightId: string | null;
  onToggle: (id: string) => void;
  onHighlight: (id: string | null) => void;
};

export function ChartLegend({
  operators,
  hidden,
  highlightId,
  onToggle,
  onHighlight,
}: ChartLegendProps) {
  return (
    <ul
      className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2"
      role="list"
      aria-label="Chart operators"
    >
      {operators.map((op) => {
        const isHidden = hidden.has(op.id);
        const dimmed = highlightId != null && highlightId !== op.id;
        return (
          <li key={op.id}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-1 py-0.5 text-[13px] text-[#A4B1CD] transition-opacity hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]"
              style={{ opacity: isHidden ? 0.35 : dimmed ? 0.15 : 1 }}
              onClick={() => onToggle(op.id)}
              onMouseEnter={() => onHighlight(op.id)}
              onMouseLeave={() => onHighlight(null)}
              onFocus={() => onHighlight(op.id)}
              onBlur={() => onHighlight(null)}
              aria-pressed={!isHidden}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: op.color }}
                aria-hidden
              />
              <span className="max-w-[140px] truncate">{op.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
