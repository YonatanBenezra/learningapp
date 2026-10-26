"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatCountdown, remainingMs } from "@/features/contests/contest-clock";
import { countdownParts, pad2 } from "@/features/contests/contest-countdown-parts";
import type { ContestDetail } from "@/types/contest";
import { playMaxPoints } from "@/lib/arena/map-play";
import "./play-hero.css";

function titleFromContest(contest: ContestDetail) {
  return contest.title.replace(/^Weekly Contest #(\d+)/i, "Weekly CTF #$1");
}

/** API sometimes omits `personalDeadlineAt`; derive from join time + time box. */
function resolvePersonalDeadline(contest: ContestDetail): string | null {
  if (contest.personalDeadlineAt) {
    return contest.personalDeadlineAt;
  }
  if (contest.startedAt) {
    const startMs = new Date(contest.startedAt).getTime();
    if (!Number.isNaN(startMs)) {
      return new Date(startMs + contest.timeBoxMinutes * 60_000).toISOString();
    }
  }
  return null;
}

function StatBlock({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="play-hero-stat">
      <p className="play-hero-stat__label">{label}</p>
      <div className={`play-hero-stat__value ${valueClassName ?? ""}`.trim()}>{children}</div>
    </div>
  );
}

function OperationClockPanel({
  deadlineIso,
  totalMinutes,
  elapsedMs,
}: {
  deadlineIso: string | null;
  totalMinutes: number;
  elapsedMs: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ms = deadlineIso ? remainingMs(deadlineIso, now) : null;
  const expired = ms != null && ms <= 0;
  const remaining = ms != null ? Math.max(0, ms) : null;
  const parts =
    remaining != null ? countdownParts(remaining) : { hours: 0, minutes: 0, seconds: 0 };

  const totalMs = totalMinutes * 60_000;
  let used = 0;
  if (elapsedMs != null) {
    used = elapsedMs;
  } else if (remaining != null && totalMs > 0) {
    used = expired ? totalMs : totalMs - remaining;
  }
  const progress = totalMs > 0 ? Math.min(100, (used / totalMs) * 100) : 0;

  const timeLabel =
    deadlineIso != null
      ? `${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`
      : elapsedMs != null && totalMs > 0
        ? (() => {
            const left = Math.max(0, totalMs - elapsedMs);
            const p = countdownParts(left);
            return `${pad2(p.hours)}:${pad2(p.minutes)}:${pad2(p.seconds)}`;
          })()
        : "00:00:00";

  return (
    <div className="play-hero-bar__seg play-hero-bar__seg--clock">
      <div className="play-hero-clock__head">
        <p className="play-hero-stat__label">Operation clock</p>
        <span className="play-hero-clock__of">of {totalMinutes}m</span>
      </div>
      <span className="play-hero-clock__time">{timeLabel}</span>
      <div className="play-hero-clock__track" aria-hidden>
        <div className="play-hero-clock__fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
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
  const endsLabel = useMemo(
    () => formatCountdown(remainingMs(windowLeft)).toUpperCase(),
    [windowLeft],
  );
  const elapsed = contest.scorecard?.elapsedMs ?? contest.elapsedMs ?? null;

  return (
    <section className="play-hero-bar" aria-label="Contest status">
      <div className="play-hero-bar__row">
        <div className="play-hero-bar__seg play-hero-bar__seg--title">
          <p className="play-hero-live">
            <span className="play-hero-live__dot" aria-hidden />
            Live · Ends in {endsLabel}
          </p>
          <h1 className="play-hero-title">{titleFromContest(contest)}</h1>
        </div>

        <div className="play-hero-bar__seg play-hero-bar__seg--stat">
          <StatBlock label="Rank">
            {rank != null ? `#${rank}` : "—"}
            {rank != null && rankDelta ? (
              <span className="play-hero-stat__delta">▲{rankDelta}</span>
            ) : null}
          </StatBlock>
        </div>

        <div className="play-hero-bar__seg play-hero-bar__seg--stat">
          <StatBlock label="Points" valueClassName="play-hero-stat__value--points">
            {score.toLocaleString()}
            <span className="play-hero-stat__suffix">
              {" "}
              / {maxPts.toLocaleString()}
            </span>
          </StatBlock>
        </div>

        <div className="play-hero-bar__seg play-hero-bar__seg--pair">
          <StatBlock label="Flags">
            {solved}
            <span className="play-hero-stat__suffix"> / {contest.problems.length}</span>
          </StatBlock>
          <StatBlock label="First bloods">{firstBloods}</StatBlock>
        </div>

        <OperationClockPanel
          deadlineIso={resolvePersonalDeadline(contest)}
          totalMinutes={contest.timeBoxMinutes}
          elapsedMs={elapsed}
        />
      </div>
    </section>
  );
}
