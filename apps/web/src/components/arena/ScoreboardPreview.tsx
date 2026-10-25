"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { avatarColorForName } from "@/lib/arena/categories";
import type { LobbyScoreboardRow } from "@/lib/arena/lobby-types";
import { cn } from "@/lib/utils";

const medalClass = (rank: number) => {
  if (rank === 1) {
    return "text-[var(--arena-medal-gold)]";
  }
  if (rank === 2) {
    return "text-[var(--arena-medal-silver)]";
  }
  if (rank === 3) {
    return "text-[var(--arena-medal-bronze)]";
  }
  return "text-[var(--arena-text-2)]";
};

export function ScoreboardPreview({
  rows,
  scoreboardHref,
  index,
}: {
  rows: LobbyScoreboardRow[];
  scoreboardHref: string;
  index: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.1 + index * 0.05 }}
      className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3.5">
        <h2 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Scoreboard
        </h2>
        <span className="font-mono text-[11px] text-[var(--arena-lime-fg)]">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-[var(--arena-lime-fg)] motion-safe:animate-pulse" />
          live · 60s
        </span>
      </div>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <motion.li
            key={row.rank}
            layout={reduce ? false : "position"}
            className="flex h-10 items-center gap-2.5 border-t border-[var(--arena-line)] px-4"
          >
            <span
              className={cn("w-[34px] shrink-0 font-mono text-[13px] font-bold", medalClass(row.rank))}
            >
              {row.rank}
            </span>
            <span
              className="flex size-[26px] shrink-0 items-center justify-center rounded-md border font-mono text-[9px] font-bold"
              style={{
                color: avatarColorForName(row.name),
                backgroundColor: `color-mix(in srgb, ${avatarColorForName(row.name)} 16%, transparent)`,
                borderColor: `color-mix(in srgb, ${avatarColorForName(row.name)} 40%, transparent)`,
              }}
              aria-hidden
            >
              {row.initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--arena-ink)]">
              {row.name}
            </span>
            <span className="w-[70px] shrink-0 text-right font-mono text-[13.5px] font-bold text-[var(--arena-ink)]">
              {row.score.toLocaleString()}
            </span>
          </motion.li>
        ))}
      </ul>
      <div className="border-t border-[var(--arena-line)] p-3 text-center">
        <Link
          href={scoreboardHref}
          className="text-[12.5px] font-semibold text-[var(--arena-lime-fg)] hover:underline"
        >
          Full scoreboard →
        </Link>
      </div>
    </motion.section>
  );
}
