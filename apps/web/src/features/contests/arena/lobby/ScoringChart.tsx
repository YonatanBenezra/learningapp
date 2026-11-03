"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

export function ScoringChart({ index }: { index: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : index * 0.06 }}
      className="flex h-full flex-col gap-3.5 rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)] p-5"
    >
      <h2 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
        Dynamic scoring
      </h2>
      <svg ref={ref} viewBox="0 0 322 146" className="h-auto w-full" aria-hidden>
        <path d="M 0 0 L 0 120 L 320 120" fill="none" stroke="var(--arena-line-2)" strokeWidth="1" />
        <motion.path
          d="M 2 10 C 62 14 112 40 162 62 C 212 80 252 68 322 70"
          fill="none"
          stroke="var(--arena-lime-fg)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={inView || reduce ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
        />
        <path
          d="M 0 70 L 320 70"
          fill="none"
          stroke="color-mix(in srgb, var(--arena-red) 60%, transparent)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text x="10" y="32" className="fill-[var(--arena-text-2)] font-mono text-[10.5px]">
          base 400
        </text>
        <text
          x="260"
          y="86"
          textAnchor="end"
          className="fill-[var(--arena-red)] font-mono text-[10.5px]"
        >
          floor 200 (50%)
        </text>
        <text
          x="322"
          y="140"
          textAnchor="end"
          className="fill-[var(--arena-text-3)] font-mono text-[10.5px]"
        >
          solves →
        </text>
      </svg>
      <p className="text-[12.5px] leading-normal text-[var(--arena-text-2)]">
        Points = base − decay(solves). Early flags are worth more.
      </p>
    </motion.section>
  );
}
