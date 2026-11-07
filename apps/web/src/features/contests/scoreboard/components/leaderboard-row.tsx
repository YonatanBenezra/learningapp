"use client";

import type { KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ScoreboardEntry } from "../types";
import { RANK_TINT } from "../types";
import { operatorProfileHref } from "../lib/profile-href";
import { Flag } from "./flag";
import { TeamAvatar } from "./team-avatar";

function rankColor(rank: number): string | undefined {
  if (rank === 1) {
    return RANK_TINT.gold;
  }
  if (rank === 2) {
    return RANK_TINT.silver;
  }
  if (rank === 3) {
    return RANK_TINT.bronze;
  }
  return undefined;
}

type LeaderboardRowProps = {
  entry: ScoreboardEntry;
  mobile?: boolean;
  showCountry?: boolean;
};

export function LeaderboardRow({ entry, mobile, showCountry = false }: LeaderboardRowProps) {
  const router = useRouter();
  const tint = rankColor(entry.rank);
  const pct = entry.total > 0 ? (entry.solved / entry.total) * 100 : 0;
  const profileHref = operatorProfileHref(entry.id);

  const onRowClick = () => {
    if (profileHref) {
      router.push(profileHref);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!profileHref) {
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick();
    }
  };

  return (
    <div
      role="row"
      tabIndex={profileHref ? 0 : undefined}
      onClick={onRowClick}
      onKeyDown={onKeyDown}
      id={entry.isYou ? "scoreboard-you-row" : undefined}
      className={`group grid h-[70px] items-center border-b border-[#1E2636] text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#9FEF00] ${
        showCountry
          ? "grid-cols-[56px_1fr_100px_88px] md:grid-cols-[80px_1fr_180px_160px_140px]"
          : "grid-cols-[56px_1fr_88px_72px] md:grid-cols-[80px_1fr_160px_140px]"
      } ${profileHref ? "cursor-pointer hover:bg-[#151C2B]" : ""} ${
        entry.isYou ? "border-l-[3px] border-l-[#9FEF00] bg-[#9FEF00]/5" : ""
      }`}
    >
      <div className="flex justify-center font-mono tabular-nums text-[#A4B1CD]" role="cell">
        <span style={{ color: tint ?? undefined }}>{entry.rank}</span>
      </div>

      <div className="flex min-w-0 items-center gap-2 pr-2" role="cell">
        <TeamAvatar name={entry.name} avatarUrl={entry.avatarUrl} size={24} />
        <span
          className={`min-w-0 truncate font-medium text-white ${profileHref ? "transition-colors group-hover:text-[#9FEF00]" : ""}`}
        >
          {entry.name}
        </span>
        {entry.isYou ? (
          <span className="hidden shrink-0 rounded-full bg-[#9FEF00]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9FEF00] md:inline">
            You
          </span>
        ) : null}
        {mobile && showCountry && entry.country ? (
          <span className="inline-flex items-center gap-1 text-[#A4B1CD] md:hidden">
            <Flag country={entry.country} size={16} />
            {entry.country}
          </span>
        ) : null}
      </div>

      {showCountry ? (
        <div className="hidden items-center gap-2 text-[#A4B1CD] md:flex" role="cell">
          <Flag country={entry.country || "WO"} size={18} />
          {entry.country || "—"}
        </div>
      ) : null}

      <div className="font-mono tabular-nums text-white" role="cell">
        {entry.points.toLocaleString()}
      </div>

      <div className="flex flex-col gap-1 pr-2" role="cell">
        {profileHref ? (
          <Link
            href={profileHref}
            onClick={(e) => e.stopPropagation()}
            className="text-[#A4B1CD] underline underline-offset-2 hover:text-[#9FEF00] max-md:text-[13px]"
          >
            <span className="md:hidden">{entry.solved}</span>
            <span className="hidden md:inline">
              {entry.solved}/{entry.total}
            </span>
          </Link>
        ) : (
          <span className="text-[#A4B1CD] max-md:text-[13px]">
            <span className="md:hidden">{entry.solved}</span>
            <span className="hidden md:inline">
              {entry.solved}/{entry.total}
            </span>
          </span>
        )}
        <div
          className="hidden h-1 w-12 max-w-full overflow-hidden rounded-full bg-[#232C3D] md:block"
          aria-hidden
        >
          <div className="h-full rounded-full bg-[#9FEF00]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
