"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { routes } from "@/config/routes";
import { remainingMs } from "@/features/contests/contest-clock";
import { scoringBannerMessage } from "@/features/contests/arena/play/play-contest-phase";
import type { PlayEntryHud } from "@/features/contests/arena/lib/play-types";
import type { ContestDetail } from "@/types/contest";
import { cn } from "@/lib/utils";

function titleFromContest(contest: ContestDetail) {
  return contest.title.replace(/^Weekly Contest #(\d+)/i, "Weekly CTF #$1");
}

function formatEndsIn(ms: number): ReactNode {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const bits: { v: number; u: string }[] = [];
  if (days > 0) {
    bits.push({ v: days, u: days === 1 ? "Day" : "Days" });
  }
  if (hours > 0 || days > 0) {
    bits.push({ v: hours, u: hours === 1 ? "Hour" : "Hours" });
  }
  bits.push({ v: minutes, u: minutes === 1 ? "Min" : "Mins" });
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className="text-[#6B7891]">Ends in</span>
      {bits.map((b, i) => (
        <span key={i}>
          <span className="font-semibold text-white tabular-nums">{b.v}</span>{" "}
          <span className="text-[#6B7891]">{b.u}</span>
        </span>
      ))}
    </span>
  );
}

export function StatBlock({
  label,
  children,
  compact,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5",
        compact ? "min-w-[72px] shrink-0 px-2" : "min-w-[88px] gap-1 px-4 first:pl-0",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B7891]">{label}</p>
      <div
        className={cn(
          "font-mono tabular-nums text-white",
          compact ? "text-base" : "text-lg",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function HudStats({ hud, compact }: { hud: PlayEntryHud; compact?: boolean }) {
  const delta = hud.rankDelta;
  return (
  <>
    <StatBlock label="Rank" compact={compact}>
      <span>
        {hud.rank != null ? `#${hud.rank}` : "—"}
        {hud.rank != null && delta !== 0 ? (
          <span
            className={cn(
              "ml-1 text-xs font-semibold",
              delta > 0 ? "text-[#9FEF00]" : "text-[#FF5A5F]",
            )}
          >
            {delta > 0 ? "↑" : "↓"}
            {Math.abs(delta)}
          </span>
        ) : null}
      </span>
    </StatBlock>
    <StatBlock label="Points" compact={compact}>
      <span>
        {hud.points.toLocaleString()}
        <span className="text-xs text-[#6B7891]"> / {hud.maxPoints.toLocaleString()}</span>
      </span>
    </StatBlock>
    <StatBlock label="Flags" compact={compact}>
      <span>
        {hud.flags}
        <span className="text-xs text-[#6B7891]"> / {hud.totalFlags}</span>
      </span>
    </StatBlock>
    <StatBlock label="First Bloods" compact={compact}>
      {hud.firstBloods}
    </StatBlock>
  </>
  );
}

export function EventSubHeader({
  contest,
  hud,
  eventEnded,
  personalTimeEnded = false,
}: {
  contest: ContestDetail;
  hud: PlayEntryHud;
  eventEnded: boolean;
  personalTimeEnded?: boolean;
}) {
  const windowEnd = contest.windowDeadlineAt ?? contest.endsAt;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (eventEnded) {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [eventEnded]);

  const remain = useMemo(
    () => (windowEnd ? remainingMs(windowEnd, now) : 0),
    [windowEnd, now],
  );
  const isLive = !eventEnded && contest.window === "open";
  const scoringBanner = scoringBannerMessage(contest);
  const virtualHref =
    contest.virtualPracticeAvailable && contest.problems[0]
      ? routes.contestPracticeProblem(contest.slug, contest.problems[0].slug)
      : null;

  return (
    <header
      className="relative border-b border-[#232C3D] bg-[#151C2B]"
      aria-label="Event status"
    >
      <div className="lp-play-container flex min-h-[72px] flex-wrap items-center justify-between gap-3 py-3 md:h-[72px] md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-base font-semibold text-white">
            {titleFromContest(contest)}
          </h1>
          {isLive ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#2A3446] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#A4B1CD]">
                <span className="size-1.5 rounded-sm bg-[#9FEF00]" aria-hidden />
                Live
              </span>
              {personalTimeEnded ? (
                <span
                  className="rounded-sm border border-[#2A3446] px-2.5 py-1 text-[11px] font-medium text-[#A4B1CD]"
                  title="Your 180-minute run has ended; challenges remain open"
                >
                  Timer ended
                </span>
              ) : null}
            </>
          ) : (
            <span className="rounded-sm bg-[#232C3D] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#A4B1CD]">
              Ended
            </span>
          )}
        </div>

        <div className="hidden items-center md:flex">
          <div className="flex items-stretch divide-x divide-[#232C3D]">
            <HudStats hud={hud} />
          </div>
        </div>

        <div className="shrink-0">
          {eventEnded ? (
            <span className="rounded-sm border border-[#2A3446] px-4 py-2 text-sm text-[#6B7891]">
              Event ended
            </span>
          ) : (
            <div className="rounded-sm border border-[#2A3446] px-4 py-2 text-sm">
              {formatEndsIn(remain)}
            </div>
          )}
        </div>
      </div>

      <div className="lp-play-container flex items-stretch divide-x divide-[#232C3D] overflow-x-auto border-t border-[#232C3D] py-2.5 md:hidden">
        <HudStats hud={hud} compact />
      </div>

      {eventEnded ? (
        <div className="h-0.5 w-full bg-[#232C3D]" aria-hidden>
          <div className="h-full w-full bg-[#6B7891]/60" />
        </div>
      ) : null}

      {scoringBanner ? (
        <div className="border-t border-[#232C3D] bg-[#0F1520]/80">
          <div className="lp-play-container py-2.5 text-xs leading-relaxed text-[#6B7891]">
            {scoringBanner}{" "}
            {virtualHref ? (
              <Link href={virtualHref} className="font-medium text-[#9FEF00] hover:underline">
                Virtual practice
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
