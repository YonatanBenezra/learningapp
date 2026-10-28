"use client";

import { motion, useReducedMotion } from "motion/react";

const BAR_COLORS = [
  "var(--color-status-pass)",
  "var(--color-status-pass)",
  "var(--arena-amber)",
  "var(--arena-amber)",
  "var(--arena-red)",
  "var(--arena-red)",
  "var(--arena-red)",
  "var(--arena-purple)",
  "var(--arena-purple)",
  "var(--arena-purple)",
];

export function DifficultyHistogram({
  votes,
  animate,
}: {
  votes: number[];
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...votes, 1);

  return (
    <div>
      <div className="flex h-14 items-end gap-1.5">
        {votes.map((v, i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-sm"
            style={{
              backgroundColor: BAR_COLORS[i],
              opacity: 0.75,
            }}
            initial={animate && !reduce ? { height: 0 } : false}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={
              reduce ? { duration: 0 } : { delay: i * 0.03, type: "spring", stiffness: 320, damping: 34 }
            }
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--arena-text-3)]">
        <span>Easy</span>
        <span>Medium</span>
        <span>Hard</span>
        <span>Insane</span>
      </div>
    </div>
  );
}
