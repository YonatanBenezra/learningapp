"use client";

import { Clock, Droplet, Flag, LineChart, Play, Trophy, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { routes } from "@/config/routes";
import type { ArenaEvent, ArenaHeroStats } from "@/lib/arena/types";
import { cn } from "@/lib/utils";
import { ArenaButton } from "./ArenaButton";
import { Countdown } from "./Countdown";
import { Tag } from "./Tag";

export function ArenaHero({
  event,
  stats,
}: {
  event: ArenaEvent;
  stats: ArenaHeroStats;
}) {
  const reduce = useReducedMotion();
  const countdownLabel =
    event.status === "upcoming" ? "EVENT STARTS IN" : "EVENT ENDS IN";
  const deadline = event.status === "upcoming" ? event.startsAt : event.endsAt;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.5 }}
      className="flex min-w-0 flex-1 flex-col gap-5 rounded-[14px] border border-[color-mix(in_srgb,var(--arena-lime)_25%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--arena-lime)_10%,transparent)_0%,var(--arena-surface)_45%)] p-4 sm:gap-[22px] sm:p-6 md:p-8"
    >
      <div className="flex flex-wrap gap-2">
        {event.status === "live" ? (
          <Tag tone="live" dot>
            LIVE
          </Tag>
        ) : null}
        <Tag tone="solo">SOLO</Tag>
        <Tag tone="advanced">{event.difficulty}</Tag>
        <Tag tone="cyan" icon={<LineChart className="size-[11px]" aria-hidden />}>
          DYNAMIC SCORING
        </Tag>
      </div>
      <div>
        <p className="font-mono text-[13px] font-medium text-[var(--arena-lime-fg)]">
          {event.kicker}
        </p>
        <h1 className="mt-1 text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--arena-ink)] sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
          {event.title}
        </h1>
        <p className="mt-3 max-w-[640px] text-sm leading-[1.55] text-[var(--arena-text-2)] sm:text-[15.5px]">
          {event.lead}
        </p>
      </div>
      <div className="flex flex-col items-stretch justify-between gap-4 min-[480px]:flex-row min-[480px]:flex-wrap lg:flex-nowrap lg:items-end">
        <Countdown deadlineIso={deadline} label={countdownLabel} />
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap">
          <ArenaButton href={routes.contest(event.slug)} className="w-full sm:w-auto">
            <Play className="size-[15px]" aria-hidden />
            JOIN EVENT
          </ArenaButton>
          <ArenaButton
            variant="ghost"
            href={routes.contest(event.slug)}
            className="w-full sm:w-auto"
          >
            <Trophy className="size-4" aria-hidden />
            SCOREBOARD
          </ArenaButton>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-ink)_2.5%,transparent)] lg:grid-cols-4">
        {[
          {
            icon: Users,
            tone: "text-[var(--arena-cyan)]",
            value: stats.operators > 0 ? stats.operators.toLocaleString() : "—",
            label: "Operators",
          },
          {
            icon: Flag,
            tone: "text-[var(--arena-lime-fg)]",
            value: stats.flagsCaptured > 0 ? stats.flagsCaptured.toLocaleString() : "—",
            label: "Flags captured",
          },
          {
            icon: Droplet,
            tone: "text-[var(--arena-red)]",
            value: stats.firstBloods,
            label: "First bloods",
          },
          {
            icon: Clock,
            tone: "text-[var(--arena-amber)]",
            value: `${stats.clockMinutes}m`,
            label: "Operation clock",
          },
        ].map((cell, index) => (
          <div
            key={cell.label}
            className={cn(
              "flex items-start gap-2.5 border-[var(--arena-line)] px-3 py-3 sm:px-4",
              index % 2 === 1 && "border-l",
              index >= 2 && "border-t",
              "lg:border-t-0",
              index > 0 && "lg:border-l",
            )}
          >
            <cell.icon className={`mt-0.5 size-4 shrink-0 ${cell.tone}`} aria-hidden />
            <div>
              <dd className="font-mono text-base font-semibold text-[var(--arena-ink)]">
                {cell.value}
              </dd>
              <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--arena-text-3)]">
                {cell.label}
              </dt>
            </div>
          </div>
        ))}
      </dl>
    </motion.section>
  );
}
