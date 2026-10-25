"use client";

import { Terminal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { LobbyRule } from "@/lib/arena/lobby-types";

export function MissionBriefing({ rules, index }: { rules: LobbyRule[]; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : index * 0.06 }}
      className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-terminal)]"
      aria-labelledby="mission-briefing-title"
    >
      <div className="flex items-center gap-2 border-b border-[var(--arena-line)] px-4 py-3 sm:px-4">
        <Terminal className="size-3.5 text-[var(--arena-lime-fg)]" aria-hidden />
        <span
          id="mission-briefing-title"
          className="font-mono text-xs text-[var(--arena-text-2)]"
        >
          &gt;_ mission_briefing.md
        </span>
      </div>
      <ol className="flex flex-col gap-3 px-5 py-[18px] sm:px-5">
        {rules.map((rule) => (
          <li key={rule.num} className="flex items-start gap-3.5">
            <span className="shrink-0 font-mono text-xs font-bold text-[var(--arena-lime-fg)]">
              {rule.num}
            </span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--arena-ink)]">
              {rule.text}
            </span>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}
