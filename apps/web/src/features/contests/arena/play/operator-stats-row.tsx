"use client";

import { authUserInitials, useAuthSession } from "@/features/auth/use-auth-session";
import type { PlayEntryHud } from "@/features/contests/arena/lib/play-types";
import { cn } from "@/lib/utils";

function ordinalRank(rank: number | null) {
  if (rank == null) {
    return "—";
  }
  const mod10 = rank % 10;
  const mod100 = rank % 100;
  let suffix = "TH";
  if (mod10 === 1 && mod100 !== 11) {
    suffix = "ST";
  } else if (mod10 === 2 && mod100 !== 12) {
    suffix = "ND";
  } else if (mod10 === 3 && mod100 !== 13) {
    suffix = "RD";
  }
  return `${rank}${suffix}`;
}

function StatCard({
  label,
  children,
  progress,
  monoMuted,
  className,
}: {
  label: string;
  children: React.ReactNode;
  progress?: number;
  monoMuted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-[78px] flex-col items-center justify-center rounded-md bg-[#151C2B] px-3",
        className,
      )}
    >
      <p
        className={cn(
          "font-mono text-lg font-semibold tabular-nums",
          monoMuted ? "text-[#A4B1CD]" : "text-white",
        )}
      >
        {children}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-[#6B7891]">
        {label}
      </p>
      {progress != null ? (
        <span className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-md bg-[#2E3B1A]">
          <span
            className="block h-full bg-[#9FEF00]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </span>
      ) : null}
    </div>
  );
}

export function OperatorStatsRow({ hud }: { hud: PlayEntryHud }) {
  const { user, signedIn } = useAuthSession();
  const name = user?.displayName?.trim() || user?.email?.split("@")[0] || "Operator";
  const initials = signedIn && user ? authUserInitials(user) : "LP";
  const scenarioPct =
    hud.totalFlags > 0 ? Math.round((hud.flags / hud.totalFlags) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
      <div className="col-span-2 flex h-[78px] items-center gap-3 rounded-md bg-[#151C2B] px-4 sm:col-span-3 xl:col-span-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1A9E8F] text-sm font-bold text-[#0F1520]">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-white">{name}</p>
          <p className="text-xs text-[#6B7891]">Solo operator</p>
        </div>
      </div>
      <StatCard label="Rank" monoMuted>
        {ordinalRank(hud.rank)}
        {hud.rankDelta !== 0 && hud.rank != null ? (
          <span
            className={cn(
              "ml-1 text-xs",
              hud.rankDelta > 0 ? "text-[#9FEF00]" : "text-[#FF5A5F]",
            )}
          >
            {hud.rankDelta > 0 ? "▲" : "▼"}
            {Math.abs(hud.rankDelta)}
          </span>
        ) : null}
      </StatCard>
      <StatCard label="Points">{hud.points.toLocaleString()}</StatCard>
      <StatCard label="Scenarios" progress={scenarioPct}>
        {hud.flags}/{hud.totalFlags}
      </StatCard>
      <StatCard label="Flags" progress={scenarioPct}>
        {hud.flags}/{hud.totalFlags}
      </StatCard>
    </div>
  );
}
