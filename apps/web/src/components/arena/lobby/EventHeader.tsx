"use client";

import { motion, useReducedMotion } from "motion/react";
import { Countdown } from "@/components/arena/Countdown";
import { Tag } from "@/components/arena/Tag";
import type { LobbyEvent } from "@/lib/arena/lobby-types";

export function EventHeader({ event }: { event: LobbyEvent }) {
  const reduce = useReducedMotion();
  const live = event.window === "open";

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.45 }}
      className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6"
    >
      <div className="flex min-w-0 flex-col gap-3 lg:max-w-[calc(100%-280px)]">
        <div className="flex flex-wrap gap-2">
          {live ? (
            <Tag tone="live" dot>
              LIVE
            </Tag>
          ) : null}
          <Tag tone="solo">SOLO</Tag>
          <Tag tone="advanced">{event.difficultyLabel}</Tag>
          {event.hintsOff ? <Tag tone="solo">HINTS OFF</Tag> : null}
        </div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--arena-ink)] sm:text-[34px] lg:text-[38px]">
          {event.title}
        </h1>
        <p className="max-w-[680px] text-sm leading-[1.55] text-[var(--arena-text-2)] sm:text-[14.5px]">
          {event.subtitle}
        </p>
      </div>
      <div className="shrink-0 lg:pb-0.5 max-lg:order-last max-lg:w-full">
        <Countdown
          deadlineIso={live ? event.endsAt : event.startsAt}
          label={live ? "EVENT ENDS IN" : "EVENT STARTS IN"}
          size="sm"
        />
      </div>
    </motion.header>
  );
}
