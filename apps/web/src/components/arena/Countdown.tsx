"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { countdownParts, pad2 } from "@/features/contests/contest-countdown-parts";

function Digit({
  value,
  label,
  size,
}: {
  value: string;
  label: string;
  size: "md" | "sm";
}) {
  const reduce = useReducedMotion();
  const box =
    size === "sm"
      ? "px-2 py-1.5"
      : "px-2.5 py-2 text-center max-sm:px-[10px] max-sm:py-2 sm:px-3 sm:py-2.5";
  const digit =
    size === "sm"
      ? "text-lg font-semibold"
      : "text-[30px] font-semibold max-sm:text-[22px]";
  return (
    <div
      className={`rounded-md border border-[var(--arena-line-2)] bg-[color-mix(in_srgb,var(--arena-ink)_4%,transparent)] text-center ${box}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={reduce ? false : { y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: "100%", opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25 }}
          className={`block font-mono leading-none text-[var(--arena-ink)] ${digit}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="mt-1 block font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--arena-text-3)]">
        {label}
      </span>
    </div>
  );
}

export function Countdown({
  deadlineIso,
  label,
  size = "md",
  unitLabels,
}: {
  deadlineIso: string | null;
  label: string;
  size?: "md" | "sm";
  unitLabels?: [string, string, string, string];
}) {
  const [now, setNow] = useState(() => Date.now());
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    if (!deadlineIso) {
      return null;
    }
    const end = new Date(deadlineIso).getTime();
    if (Number.isNaN(end)) {
      return null;
    }
    return Math.max(0, end - now);
  }, [deadlineIso, now]);

  const parts = remaining != null ? countdownParts(remaining) : null;
  const defaultUnits =
    size === "sm"
      ? (["D", "H", "M", "S"] as const)
      : (["DAYS", "HRS", "MIN", "SEC"] as const);
  const units = unitLabels ?? defaultUnits;
  const boxes = parts
    ? [
        { label: units[0], value: pad2(parts.days) },
        { label: units[1], value: pad2(parts.hours) },
        { label: units[2], value: pad2(parts.minutes) },
        { label: units[3], value: pad2(parts.seconds) },
      ]
    : [];

  const polite = parts
    ? `${parts.days} days ${parts.hours} hours ${parts.minutes} minutes ${parts.seconds} seconds remaining`
    : "Countdown unavailable";

  if (!parts) {
    return null;
  }

  return (
    <div className="min-w-0 max-w-full">
      <p className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-text-3)]">
        {label}
      </p>
      <p className="sr-only" aria-live="polite">
        {polite}
      </p>
      <div
        className={`flex max-w-full flex-nowrap items-center overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${size === "sm" ? "gap-1.5" : "gap-1 sm:gap-1.5"}`}
        aria-hidden={reduce ? undefined : true}
      >
        {boxes.map((box, index) => (
          <div key={box.label} className="flex shrink-0 items-center gap-1.5">
            <Digit value={box.value} label={box.label} size={size} />
            {index < boxes.length - 1 ? (
              <span
                className={`font-mono text-[var(--arena-text-3)] ${size === "sm" ? "text-lg" : "text-xl sm:text-[26px]"}`}
              >
                :
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
