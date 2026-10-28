"use client";

import type { ArenaCategoryId } from "@/lib/arena/categories";
import { ARENA_CATEGORIES } from "@/lib/arena/categories";
import type { ScoreCategoryProgress } from "@/lib/arena/scoreboard";

const ORDER: ArenaCategoryId[] = [
  "prompt-injection",
  "retrieval",
  "guardrails",
  "evals",
  "exfiltration",
];

export function CategoryBars({
  categories,
  className,
}: {
  categories: Record<ArenaCategoryId, ScoreCategoryProgress>;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      {ORDER.map((id) => {
        const meta = ARENA_CATEGORIES[id];
        const { solved, total } = categories[id] ?? { solved: 0, total: 5 };
        const pct = total > 0 ? (solved / total) * 100 : 0;
        const label = `${meta.name} ${solved}/${total}`;
        return (
          <div
            key={id}
            className="h-1.5 w-[38px] shrink-0 overflow-hidden rounded-sm bg-[color-mix(in_srgb,var(--arena-ink)_7%,transparent)]"
            title={label}
            role="img"
            aria-label={label}
          >
            <div
              className="h-full rounded-sm transition-[width] duration-300"
              style={{
                width: `${pct}%`,
                backgroundColor: meta.colorVar,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
