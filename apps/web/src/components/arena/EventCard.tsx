"use client";

import { Bell, Check, Clock, Flag, Play, Trophy, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { formatCountdown } from "@/features/contests/contest-clock";
import type { ArenaEvent } from "@/lib/arena/types";
import { cn } from "@/lib/utils";
import { ArenaButton } from "./ArenaButton";
import { Tag } from "./Tag";

const accentVar: Record<ArenaEvent["accent"], string> = {
  lime: "var(--arena-lime)",
  cyan: "var(--arena-cyan)",
  purple: "var(--arena-purple)",
};

function statusText(event: ArenaEvent, remainingMs: number | null) {
  if (event.myResult) {
    return event.myResult;
  }
  if (remainingMs == null) {
    return "";
  }
  const t = formatCountdown(remainingMs).toUpperCase();
  if (event.status === "upcoming") {
    return `STARTS IN ${t}`;
  }
  if (event.status === "live") {
    return `ENDS IN ${t}`;
  }
  return "";
}

export function EventCard({ event, index }: { event: ArenaEvent; index: number }) {
  const reduce = useReducedMotion();
  const accent = accentVar[event.accent];
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target =
      event.status === "upcoming"
        ? new Date(event.startsAt).getTime()
        : new Date(event.endsAt).getTime();
    if (Number.isNaN(target)) {
      return;
    }
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [event.endsAt, event.startsAt, event.status]);

  const ops =
    event.status === "upcoming" && event.registeredCount != null
      ? `${event.registeredCount} registered`
      : `${event.operatorCount} ops`;

  const status = statusText(event, remaining);
  const statusColor =
    event.status === "live"
      ? "text-[var(--arena-lime-fg)]"
      : event.status === "upcoming"
        ? "text-[var(--arena-cyan)]"
        : "text-[var(--arena-text-2)]";

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : index * 0.06 }}
      whileHover={reduce ? undefined : { y: -2 }}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-[var(--arena-surface)] transition-[border-color] duration-200",
        event.status === "live"
          ? "border-[color-mix(in_srgb,var(--arena-lime)_35%,var(--arena-line))] hover:border-[color-mix(in_srgb,var(--arena-lime)_45%,var(--arena-line))]"
          : "border-[var(--arena-line)] hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--arena-line))]",
      )}
      style={{ ["--accent" as string]: accent }}
    >
      <div
        className="relative h-[120px] overflow-hidden"
        style={{
          background: `linear-gradient(105deg, color-mix(in srgb, ${accent} 25%, transparent) 0%, var(--arena-surface) 70%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `linear-gradient(to right, color-mix(in srgb, ${accent} 100%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, ${accent} 100%, transparent) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute left-3 top-6 font-mono text-[2rem] font-bold opacity-[0.22] sm:left-16 sm:text-[2.75rem] md:left-[120px] lg:left-[250px] lg:text-[52px] lg:top-7"
          style={{ color: accent }}
          aria-hidden
        >
          {event.code}
        </span>
        <div className="relative flex flex-wrap gap-1.5 p-4">
          {event.status === "live" ? (
            <Tag tone="live" dot>
              LIVE
            </Tag>
          ) : null}
          {event.status === "upcoming" ? <Tag tone="upcoming">UPCOMING</Tag> : null}
          {event.status === "archived" ? <Tag tone="archived">ARCHIVED</Tag> : null}
          {event.status !== "archived" ? (
            <Tag tone="advanced">{event.difficulty}</Tag>
          ) : null}
          {event.status === "archived" && event.myResult ? (
            <Tag tone="played" icon={<Check className="size-3" aria-hidden />}>
              PLAYED
            </Tag>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3.5 p-[18px]">
        <h3 className="text-lg font-bold tracking-[-0.01em] text-[var(--arena-ink)]">
          {event.title}
        </h3>
        <p className="text-[13px] leading-normal text-[var(--arena-text-2)]">{event.description}</p>
        <div className="flex flex-wrap gap-4 font-mono text-xs text-[var(--arena-text-2)]">
          <span className="inline-flex items-center gap-1">
            <Flag className="size-[13px] text-[var(--arena-text-3)]" aria-hidden />
            {event.challengeCount} challenges
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-[13px] text-[var(--arena-text-3)]" aria-hidden />
            {ops}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-[13px] text-[var(--arena-text-3)]" aria-hidden />
            {event.clockMinutes}m
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-2.5 border-t border-[var(--arena-line)] pt-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <span className={cn("font-mono text-xs font-semibold", statusColor)}>{status}</span>
          {event.status === "live" ? (
            <ArenaButton size="sm" href={routes.contest(event.slug)}>
              <Play className="size-3.5" aria-hidden />
              JOIN
            </ArenaButton>
          ) : null}
          {event.status === "upcoming" ? (
            <ArenaButton size="sm" variant="ghost" href={routes.contest(event.slug)}>
              <Bell className="size-3.5" aria-hidden />
              NOTIFY ME
            </ArenaButton>
          ) : null}
          {event.status === "archived" ? (
            <ArenaButton size="sm" variant="ghost" href={routes.contest(event.slug)}>
              <Trophy className="size-3.5" aria-hidden />
              RESULTS
            </ArenaButton>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
