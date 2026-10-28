"use client";

import { motion, useReducedMotion } from "motion/react";
import { Droplet, Trophy } from "lucide-react";
import {
  avatarInitialsForName,
} from "@/lib/arena/categories";
import type { PodiumPlace } from "@/lib/arena/scoreboard";

const ORDER: PodiumPlace["place"][] = [2, 1, 3];

const BLOCK_HEIGHT: Record<PodiumPlace["place"], number> = {
  1: 200,
  2: 150,
  3: 120,
};

const AVATAR: Record<PodiumPlace["place"], number> = {
  1: 52,
  2: 42,
  3: 42,
};

function medalVar(place: PodiumPlace["place"]): string {
  if (place === 1) {
    return "var(--arena-medal-gold)";
  }
  if (place === 2) {
    return "var(--arena-medal-silver)";
  }
  return "var(--arena-medal-bronze)";
}

export function Podium({ top3 }: { top3: PodiumPlace[] }) {
  const reduce = useReducedMotion();
  const byPlace = Object.fromEntries(top3.map((p) => [p.place, p])) as Record<
    PodiumPlace["place"],
    PodiumPlace
  >;

  return (
    <section
      className="flex h-full flex-row items-end gap-3.5 rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)] px-6 pt-6 sm:gap-3.5"
      aria-label="Top three operators"
    >
      {ORDER.map((place, colIndex) => {
        const entry = byPlace[place];
        if (!entry) {
          return null;
        }
        const color = medalVar(place);
        const height = BLOCK_HEIGHT[place];
        const avatarSize = AVATAR[place];
        const stagger = place === 3 ? 0 : place === 2 ? 0.08 : 0.16;

        return (
          <div
            key={place}
            className="flex min-w-0 flex-1 flex-col items-center gap-2.5 text-center"
          >
            {place === 1 ? (
              <Trophy
                className="size-[22px] text-[var(--arena-medal-gold)]"
                aria-hidden
              />
            ) : (
              <span className="h-[22px]" aria-hidden />
            )}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduce ? 0 : 0.35 + colIndex * 0.06,
                duration: 0.35,
              }}
              className="flex flex-col items-center gap-2.5"
            >
              <span
                className="flex shrink-0 items-center justify-center rounded-md border font-mono font-bold"
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  fontSize: place === 1 ? 14 : 12,
                  color,
                  borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
                }}
              >
                {avatarInitialsForName(entry.user)}
              </span>
              <p className="truncate text-sm font-bold text-[var(--arena-ink)]">{entry.user}</p>
              <p className="flex items-center justify-center gap-2">
                <span className="font-mono text-[13px] font-bold text-[var(--arena-lime-fg)]">
                  {entry.points.toLocaleString()}
                </span>
                <Droplet className="size-[11px] text-[var(--arena-red)]" aria-hidden />
                <span className="font-mono text-xs text-[var(--arena-text-2)]">
                  {entry.firstBloods}
                </span>
              </p>
            </motion.div>
            <motion.div
              className="flex w-full items-end justify-center overflow-hidden rounded-t-lg border border-b-0 font-mono text-[34px] font-bold sm:text-[34px]"
              style={{
                borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                color,
                background: `linear-gradient(to bottom, color-mix(in srgb, ${color} 28%, transparent), color-mix(in srgb, ${color} 2%, transparent))`,
              }}
              initial={reduce ? { height } : { height: 0 }}
              animate={{ height }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 18,
                delay: reduce ? 0 : stagger,
              }}
              aria-label={`${place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"} place`}
            >
              <span className="pb-2">#{place}</span>
            </motion.div>
          </div>
        );
      })}
    </section>
  );
}

/** Shorter podium blocks on small screens */
export function PodiumResponsive({ top3 }: { top3: PodiumPlace[] }) {
  return (
    <>
      <div className="hidden sm:block">
        <Podium top3={top3} />
      </div>
      <div className="sm:hidden">
        <PodiumMobile top3={top3} />
      </div>
    </>
  );
}

function PodiumMobile({ top3 }: { top3: PodiumPlace[] }) {
  const reduce = useReducedMotion();
  const byPlace = Object.fromEntries(top3.map((p) => [p.place, p])) as Record<
    PodiumPlace["place"],
    PodiumPlace
  >;
  const heights: Record<PodiumPlace["place"], number> = { 1: 140, 2: 110, 3: 90 };
  const avatars: Record<PodiumPlace["place"], number> = { 1: 40, 2: 34, 3: 34 };

  return (
    <section className="flex flex-row items-end gap-2 rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)] px-4 pt-4">
      {ORDER.map((place) => {
        const entry = byPlace[place];
        if (!entry) {
          return null;
        }
        const color = medalVar(place);
        return (
          <div key={place} className="flex flex-1 flex-col items-center gap-2">
            <span
              className="flex items-center justify-center rounded-md border font-mono text-[10px] font-bold"
              style={{
                width: avatars[place],
                height: avatars[place],
                color,
                borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
              }}
            >
              {avatarInitialsForName(entry.user)}
            </span>
            <motion.div
              className="flex w-full items-end justify-center rounded-t-md border border-b-0 font-mono text-2xl font-bold"
              style={{
                borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                color,
                background: `linear-gradient(to bottom, color-mix(in srgb, ${color} 28%, transparent), color-mix(in srgb, ${color} 2%, transparent))`,
              }}
              initial={reduce ? { height: heights[place] } : { height: 0 }}
              animate={{ height: heights[place] }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              #{place}
            </motion.div>
          </div>
        );
      })}
    </section>
  );
}
