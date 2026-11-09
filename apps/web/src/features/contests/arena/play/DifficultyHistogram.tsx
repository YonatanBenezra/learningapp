"use client";

import { motion, useReducedMotion } from "motion/react";

const BAR_COLORS = [
  "#9FEF00",
  "#9FEF00",
  "#FFAF00",
  "#FFAF00",
  "#FF3E3E",
  "#FF3E3E",
  "#FF3E3E",
  "#B45CFF",
  "#B45CFF",
  "#B45CFF",
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
            className="flex-1 rounded-sm opacity-80"
            style={{ backgroundColor: BAR_COLORS[i] }}
            initial={animate && !reduce ? { height: 0 } : false}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={
              reduce
                ? { duration: 0 }
                : { delay: i * 0.03, type: "spring", stiffness: 320, damping: 34 }
            }
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] font-semibold uppercase tracking-wider text-[#6B7891]">
        <span>Easy</span>
        <span>Medium</span>
        <span>Hard</span>
        <span>Insane</span>
      </div>
    </div>
  );
}
