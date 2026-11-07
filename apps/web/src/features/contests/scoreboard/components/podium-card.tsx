"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import type { ScoreboardEntry } from "../types";
import { RANK_TINT } from "../types";
import { operatorProfileHref } from "../lib/profile-href";
import { Flag } from "./flag";
import { TeamAvatar } from "./team-avatar";

type PodiumCardProps = {
  entry: ScoreboardEntry;
  place: 1 | 2 | 3;
};

const BADGE = {
  1: {
    bg: RANK_TINT.gold,
    content: <Crown className="size-[22px] text-[#1a1200]" strokeWidth={2.35} />,
  },
  2: {
    bg: RANK_TINT.silver,
    content: <span className="text-[16px] font-bold text-[#1c2230]">2</span>,
  },
  3: {
    bg: RANK_TINT.bronze,
    content: <span className="text-[16px] font-bold text-[#2a1400]">3</span>,
  },
} as const;

export function PodiumCard({ entry, place }: PodiumCardProps) {
  const profileHref = operatorProfileHref(entry.id);
  const badge = BADGE[place];
  const heightClass = place === 1 ? "h-[368px]" : "h-[340px]";

  const flagsNode = (
    <span className="text-[13px] font-normal text-[#A4B1CD] underline decoration-[#A4B1CD]/80 underline-offset-[3px]">
      {entry.solved}/{entry.total} flags
    </span>
  );

  return (
    <div
      className={`lp-sb-podium-card ${place === 1 ? "lp-sb-podium-card--first" : ""} ${heightClass}`}
    >
      <div
        className="lp-sb-podium-rank-badge"
        style={{ backgroundColor: badge.bg }}
        aria-label={`Rank ${place}`}
      >
        {badge.content}
      </div>

      <div className="lp-sb-podium-outer relative h-full bg-[#18202F] p-[5px]">
        <div className="lp-sb-podium-inner relative flex h-full flex-col bg-[#1B2434] shadow-[inset_0_0_0_1px_#232C3D]">
          {place === 1 ? <div className="lp-sb-podium-avatar-glow" aria-hidden /> : null}

          <div className="relative flex flex-1 flex-col items-center px-5 pt-11 text-center">
            <div className="rounded-full ring-[3px] ring-[#2A3446] ring-offset-2 ring-offset-[#1B2434]">
              <TeamAvatar name={entry.name} avatarUrl={entry.avatarUrl} size={76} />
            </div>

            <p className="mt-5 max-w-full truncate text-[20px] font-semibold leading-tight tracking-[-0.02em] text-white">
              {entry.name}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[14px] text-[#A4B1CD]">
          {entry.country ? (
            <span className="inline-flex items-center gap-1.5">
              <Flag country={entry.country} size={18} />
              <span>{entry.country}</span>
            </span>
          ) : null}
              <span className="font-mono text-[14px] tabular-nums tracking-tight text-[#A4B1CD]">
                {entry.points.toLocaleString()} pts
              </span>
            </div>

            <div className="mt-auto pb-12 pt-6">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="transition-colors hover:text-[#9FEF00] hover:decoration-[#9FEF00]"
                >
                  {flagsNode}
                </Link>
              ) : (
                flagsNode
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
