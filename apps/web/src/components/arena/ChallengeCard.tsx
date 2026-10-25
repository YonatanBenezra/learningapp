"use client";

import { Droplet, Flag, Lock, Users } from "lucide-react";
import Link from "next/link";
import { ARENA_CATEGORIES, DIFFICULTY_TONE, type ArenaDifficulty } from "@/lib/arena/categories";
import type { ArenaCategoryId } from "@/lib/arena/categories";
import { dynamicPoints } from "@/lib/arena/points";
import { Tag } from "./Tag";
import { cn } from "@/lib/utils";

export type ChallengeCardVariant = "locked" | "open" | "solved" | "attempted";

export type ChallengeCardProps = {
  variant: ChallengeCardVariant;
  title: string;
  categoryId: ArenaCategoryId;
  difficulty: ArenaDifficulty;
  basePoints: number;
  solves: number;
  firstBloodUser?: string;
  href?: string;
  className?: string;
  solveTime?: string;
  disabled?: boolean;
};

export function ChallengeCard({
  variant,
  title,
  categoryId,
  difficulty,
  basePoints,
  solves,
  firstBloodUser,
  href,
  className,
  solveTime,
  disabled,
}: ChallengeCardProps) {
  const meta = ARENA_CATEGORIES[categoryId];
  const Icon = meta.Icon;
  const points = dynamicPoints(basePoints, solves);
  const locked = variant === "locked";
  const tone = DIFFICULTY_TONE[difficulty];

  const inner = (
    <article
      className={cn(
        "relative flex flex-col gap-3.5 overflow-hidden rounded-[10px] border bg-[var(--arena-surface)] p-4",
        variant === "solved"
          ? "border-[color-mix(in_srgb,var(--arena-lime)_45%,var(--arena-line))]"
          : "border-[var(--arena-line)]",
        locked && "opacity-[0.55]",
        disabled && !locked && "opacity-70",
        className,
      )}
      aria-disabled={locked ? true : undefined}
      title={locked ? "Join the event to unlock" : undefined}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ backgroundColor: `color-mix(in srgb, ${meta.colorVar} 80%, transparent)` }}
        aria-hidden
      />
      <div className="flex gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
          style={{
            backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${meta.colorVar} 35%, transparent)`,
          }}
        >
          <Icon className="size-[17px]" style={{ color: meta.colorVar }} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--arena-ink)]">
            {title}
          </h3>
          <p
            className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: meta.colorVar }}
          >
            {meta.name}
          </p>
        </div>
        {locked ? (
          <Lock className="size-4 shrink-0 text-[var(--arena-text-3)]" aria-hidden />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone={tone}>{difficulty}</Tag>
        <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[var(--arena-text-2)]">
          <Users className="size-3 text-[var(--arena-text-3)]" aria-hidden />
          {solves} solves
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[17px] font-bold text-[var(--arena-ink)]">{points}</span>
        <span className="font-mono text-[10.5px] text-[var(--arena-text-3)]">pts</span>
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--arena-line)] pt-2.5">
        {firstBloodUser ? (
          <>
            <Droplet className="size-3 shrink-0 text-[var(--arena-red)]" aria-hidden />
            <span className="font-mono text-[11.5px] text-[var(--arena-text-2)]">
              {firstBloodUser}
            </span>
            <span className="text-[11px] text-[var(--arena-text-3)]">first blood</span>
          </>
        ) : null}
        <span className="flex-1" />
        {variant === "solved" ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--arena-lime-fg)]">
            PWNED
            {solveTime ? (
              <span className="font-normal text-[var(--arena-text-3)]">{solveTime}</span>
            ) : null}
            <Flag className="size-3.5 fill-[var(--arena-lime-fg)] text-[var(--arena-lime-fg)]" />
          </span>
        ) : (
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--arena-text-3)]">
            {variant === "locked"
              ? "JOIN TO PLAY"
              : variant === "attempted"
                ? "IN PROGRESS"
                : disabled
                  ? "CLOSED"
                  : "OPEN"}
          </span>
        )}
      </div>
    </article>
  );

  if (locked || disabled || !href) {
    return inner;
  }
  return (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      {inner}
    </Link>
  );
}
