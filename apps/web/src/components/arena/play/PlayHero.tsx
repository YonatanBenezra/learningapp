"use client";

import { useEffect, useState } from "react";
import { formatCountdown, remainingMs } from "@/features/contests/contest-clock";
import { countdownParts, pad2 } from "@/features/contests/contest-countdown-parts";
import type { ContestDetail } from "@/types/contest";
import { playMaxPoints } from "@/lib/arena/map-play";
function titleFromContest(contest: ContestDetail) {
  return contest.title.replace(/^Weekly Contest #(\d+)/i, "Weekly CTF #$1");
}

function OperationClock({ deadlineIso }: { deadlineIso: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!deadlineIso) {
    return <span className="font-mono text-2xl font-semibold text-[var(--arena-cyan)]">—</span>;
  }
  const ms = remainingMs(deadlineIso, now);
  const parts = countdownParts(ms);
  return (
    <span className="font-mono text-[26px] font-semibold tracking-wide text-[var(--arena-cyan)]">
      {pad2(parts.hours)}:{pad2(parts.minutes)}:{pad2(parts.seconds)}
    </span>
  );
}

export function PlayHero({
  contest,
  rank,
  rankDelta,
  solved,
  firstBloods,
}: {
  contest: ContestDetail;
  rank: number | null;
  rankDelta?: number;
  solved: number;
  firstBloods: number;
}) {
  const score = contest.scorecard?.totalScore ?? contest.totalScore ?? 0;
  const maxPts = playMaxPoints(contest);
  const windowLeft = contest.windowDeadlineAt ?? contest.endsAt;
  const endsLabel = formatCountdown(remainingMs(windowLeft)).toUpperCase();

  return (
    <section className="overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--arena-lime)_30%,var(--arena-line))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--arena-lime)_8%,transparent)_0%,var(--arena-surface)_55%)] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-lime-fg)]">
            Ends in {endsLabel}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--arena-ink)] sm:text-2xl">
            {titleFromContest(contest)}
          </h1>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-6">
          <div>
            <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
              Rank
            </dt>
            <dd className="mt-0.5 flex items-baseline gap-1 font-mono text-lg font-semibold text-[var(--arena-ink)]">
              {rank != null ? `#${rank}` : "—"}
              {rankDelta ? (
                <span className="text-xs font-bold text-[var(--arena-lime-fg)]">▲{rankDelta}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
              Points
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[var(--arena-ink)]">
              {score.toLocaleString()}{" "}
              <span className="text-sm font-medium text-[var(--arena-text-3)]">
                / {maxPts.toLocaleString()}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
              Flags
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[var(--arena-ink)]">
              {solved} / {contest.problems.length}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
              First bloods
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-[var(--arena-ink)]">
              {firstBloods}
            </dd>
          </div>
        </dl>
        <div className="text-right">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
            Operation clock
          </p>
          <OperationClock deadlineIso={contest.personalDeadlineAt} />
        </div>
      </div>
    </section>
  );
}
