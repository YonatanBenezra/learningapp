"use client";

import { ArrowRight, Droplet, Flag, Lock, Users } from "lucide-react";
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
  attemptTries?: number;
  disabled?: boolean;
  play?: boolean;
  active?: boolean;
  onPreview?: () => void;
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
  attemptTries,
  disabled,
  play = false,
  active = false,
  onPreview,
}: ChallengeCardProps) {
  const meta = ARENA_CATEGORIES[categoryId];
  const Icon = meta.Icon;
  const points = dynamicPoints(basePoints, solves);
  const locked = variant === "locked";
  const solved = variant === "solved";
  const tone = DIFFICULTY_TONE[difficulty];

  const inner = (
    <article
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-[10px] border bg-[var(--arena-surface)] p-4",
        play && active
          ? "border-[color-mix(in_srgb,var(--arena-cyan)_60%,var(--arena-line))]"
          : play && solved
            ? "border-[color-mix(in_srgb,var(--arena-lime)_45%,var(--arena-line))] bg-[color-mix(in_srgb,var(--arena-lime)_4%,transparent)]"
            : play
              ? "border-[var(--arena-line)]"
            : solved
              ? "border-[color-mix(in_srgb,var(--arena-lime)_45%,var(--arena-line))]"
              : "border-[var(--arena-line)]",
        locked && "opacity-[0.55]",
        disabled && !locked && "opacity-80",
        className,
      )}
      aria-disabled={locked ? true : undefined}
      title={locked ? "Join the event to unlock" : undefined}
    >
      {!(play && solved) ? (
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ backgroundColor: `color-mix(in srgb, ${meta.colorVar} 80%, transparent)` }}
          aria-hidden
        />
      ) : null}

      {play && solved ? (
        <span
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--arena-lime)_45%,transparent)] bg-[color-mix(in_srgb,var(--arena-lime)_12%,transparent)]"
          aria-hidden
        >
          <Flag className="size-3.5 fill-[var(--color-brand-on)] text-[var(--color-brand-on)]" />
        </span>
      ) : null}

      <div className="flex gap-3 pr-8">
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
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--arena-ink)]">
            {title}
          </h3>
          <p
            className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: meta.colorVar }}
          >
            {play ? meta.name.toUpperCase() : meta.name}
          </p>
        </div>
        {locked ? (
          <Lock className="size-4 shrink-0 text-[var(--arena-text-3)]" aria-hidden />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={tone}>{difficulty}</Tag>
        <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[var(--arena-text-2)]">
          <Users className="size-3 text-[var(--arena-text-3)]" aria-hidden />
          {solves} solves
        </span>
        <span className="ml-auto flex items-baseline gap-0.5">
          <span
            className={cn(
              "font-mono text-[17px] font-bold leading-none",
              play && solved ? "text-[var(--arena-lime-fg)]" : "text-[var(--arena-ink)]",
            )}
          >
            {points}
          </span>
          <span className="font-mono text-[10.5px] text-[var(--arena-text-3)]">pts</span>
        </span>
      </div>

      <div className="flex min-h-[28px] items-center gap-2 border-t border-[var(--arena-line)] pt-2.5">
        {!solved && firstBloodUser ? (
          <>
            <Droplet className="size-3 shrink-0 text-[var(--arena-red)]" aria-hidden />
            <span className="font-mono text-[11.5px] text-[var(--arena-text-2)]">
              {firstBloodUser}
            </span>
            <span className="text-[11px] text-[var(--arena-text-3)]">first blood</span>
          </>
        ) : null}
        <span className="flex-1" />
        {solved ? (
          <span className="ml-auto font-mono text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--arena-lime-fg)]">
            {play && solveTime ? `PWNED · ${solveTime}` : "PWNED"}
            {!play ? (
              <Flag className="size-3.5 fill-[var(--arena-lime-fg)] text-[var(--arena-lime-fg)]" />
            ) : null}
          </span>
        ) : (
          <span
            className={cn(
              "ml-auto font-mono text-[10.5px] font-bold uppercase tracking-[0.06em]",
              play && variant === "attempted" && attemptTries
                ? "text-[var(--arena-amber)]"
                : "text-[var(--arena-text-3)]",
            )}
          >
            {variant === "locked"
              ? "JOIN TO PLAY"
              : variant === "attempted"
                ? play && attemptTries
                  ? `${attemptTries} TRIES`
                  : "IN PROGRESS"
                : disabled
                  ? "CLOSED"
                  : play ? (
                    <ArrowRight className="size-3.5 text-[var(--arena-text-2)]" aria-hidden />
                  ) : (
                    "OPEN"
                  )}
          </span>
        )}
      </div>
    </article>
  );

  if (play && onPreview && !locked) {
    return (
      <button
        type="button"
        className="block w-full cursor-pointer text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--arena-ink)_20%,var(--arena-line))] hover:shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
        onClick={onPreview}
      >
        {inner}
      </button>
    );
  }

  if (locked || disabled || !href) {
    return inner;
  }
  return (
    <Link
      href={href}
      className="block transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
    >
      {inner}
    </Link>
  );
}
