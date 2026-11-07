"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ScoreboardEntry } from "../types";
import { PodiumCard } from "./podium-card";

type PodiumProps = {
  entries: [ScoreboardEntry | undefined, ScoreboardEntry | undefined, ScoreboardEntry | undefined];
};

export function Podium({ entries }: PodiumProps) {
  const reduce = useReducedMotion();
  const [first, second, third] = entries;

  return (
    <section className="lp-sb-container mt-10 md:mt-12" aria-label="Top three operators">
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-end md:justify-center md:gap-5">
        <motion.div
          className="w-full shrink-0 md:order-1 md:w-[280px]"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce ? undefined : { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.04 }
          }
        >
          {second ? <PodiumCard entry={second} place={2} /> : null}
        </motion.div>

        <motion.div
          className="w-full shrink-0 md:order-2 md:w-[280px] md:-translate-y-9"
          initial={reduce ? false : { opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce ? undefined : { type: "spring", stiffness: 260, damping: 22, delay: 0.18 }
          }
        >
          {first ? <PodiumCard entry={first} place={1} /> : null}
        </motion.div>

        <motion.div
          className="w-full shrink-0 md:order-3 md:w-[280px]"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce ? undefined : { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.08 }
          }
        >
          {third ? <PodiumCard entry={third} place={3} /> : null}
        </motion.div>
      </div>
    </section>
  );
}
