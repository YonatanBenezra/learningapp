"use client";

import { motion, useReducedMotion } from "motion/react";
import { ARENA_CATEGORIES } from "@/lib/arena/categories";
import type { LobbyCategoryRow } from "@/lib/arena/lobby-types";

export function CategoryBreakdown({
  categories,
  challengeCount,
  index,
}: {
  categories: LobbyCategoryRow[];
  challengeCount: number;
  index: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : index * 0.06 }}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3.5">
        <h2 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Categories
        </h2>
        <span className="font-mono text-[11.5px] text-[var(--arena-text-2)]">
          {challengeCount} challenges
        </span>
      </div>
      <ul className="flex flex-1 flex-col">
        {categories.map((row) => {
          const meta = ARENA_CATEGORIES[row.categoryId];
          const Icon = meta.Icon;
          return (
            <li
              key={row.categoryId}
              className="flex items-center gap-3 border-t border-[var(--arena-line)] px-4 py-2.5"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
                  borderColor: `color-mix(in srgb, ${meta.colorVar} 35%, transparent)`,
                }}
              >
                <Icon className="size-[13px]" style={{ color: meta.colorVar }} aria-hidden />
              </span>
              <span className="text-[13px] font-medium text-[var(--arena-ink)]">{meta.name}</span>
              <span className="flex-1" />
              <span className="font-mono text-xs text-[var(--arena-text-2)]">{row.count}×</span>
              <span
                className="min-w-[4.5rem] text-right font-mono text-xs font-semibold"
                style={{ color: meta.colorVar }}
              >
                {row.points.toLocaleString()} pts
              </span>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
