"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatCountdown, remainingMs } from "@/features/contests/contest-clock";
import { countdownParts, pad2 } from "@/features/contests/contest-countdown-parts";
import type { PlayEntryHud } from "@/lib/arena/play-types";
import type { ContestDetail } from "@/types/contest";
import "./operator-hud.css";

function titleFromContest(contest: ContestDetail) {
  return contest.title.replace(/^Weekly Contest #(\d+)/i, "Weekly CTF #$1");
}

function resolveDeadline(contest: ContestDetail, hud: PlayEntryHud): string | null {
  if (hud.personalDeadlineAt) {
    return hud.personalDeadlineAt;
  }
  if (contest.startedAt) {
    const t = new Date(contest.startedAt).getTime();
    if (!Number.isNaN(t)) {
      return new Date(t + contest.timeBoxMinutes * 60_000).toISOString();
    }
  }
  return null;
}

function StatCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="operator-hud__cell operator-hud__cell--stat">
      <p className="operator-hud__label">{label}</p>
      <div className="operator-hud__value">{children}</div>
    </div>
  );
}

function OperationClock({
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
  const under10m = remaining != null && remaining > 0 && remaining < 10 * 60_000;
  const parts = remaining != null ? countdownParts(remaining) : { hours: 0, minutes: 0, seconds: 0 };

  const totalMs = totalMinutes * 60_000;
  let used = 0;
  if (elapsedMs != null) {
    used = elapsedMs;
  } else if (remaining != null && totalMs > 0) {
    used = expired ? totalMs : totalMs - remaining;
  }
  const progress = totalMs > 0 ? Math.min(100, (used / totalMs) * 100) : 0;

  const timeClass = expired
    ? "operator-hud__clock-time operator-hud__clock-time--expired"
    : under10m
      ? "operator-hud__clock-time operator-hud__clock-time--warn"
      : "operator-hud__clock-time";

  const fillClass = expired
    ? "operator-hud__clock-fill operator-hud__clock-fill--expired"
    : under10m
      ? "operator-hud__clock-fill operator-hud__clock-fill--warn"
      : "operator-hud__clock-fill";

  return (
    <div className="operator-hud__cell operator-hud__cell--clock">
      <div className="operator-hud__clock-head">
        <p className="operator-hud__label">Operation clock</p>
        <span className="operator-hud__clock-of">of {totalMinutes}m</span>
      </div>
      <p className={timeClass}>
        {expired
          ? "EXPIRED"
          : deadlineIso
            ? `${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`
            : "—"}
      </p>
      <div className="operator-hud__clock-track" aria-hidden>
        <div className={fillClass} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export function OperatorHud({
  contest,
  hud,
  windowEndsLabel,
}: {
  contest: ContestDetail;
  hud: PlayEntryHud;
  windowEndsLabel: string;
}) {
  const deadline = resolveDeadline(contest, hud);
  const delta = hud.rankDelta;
  const deltaDown = delta < 0;

  return (
    <section className="operator-hud" aria-label="Operator status">
      <div className="operator-hud__row">
        <div className="operator-hud__cell operator-hud__cell--event">
          <p className="operator-hud__live">
            <span className="operator-hud__live-dot" aria-hidden />
            Live · Ends in {windowEndsLabel}
          </p>
          <h1 className="operator-hud__title">{titleFromContest(contest)}</h1>
        </div>

        <StatCell label="Rank">
          {hud.rank != null ? `#${hud.rank}` : "—"}
          {hud.rank != null && delta !== 0 ? (
            <span
              className={
                deltaDown ? "operator-hud__delta operator-hud__delta--down" : "operator-hud__delta"
              }
            >
              {deltaDown ? "▼" : "▲"} {Math.abs(delta)}
            </span>
          ) : null}
        </StatCell>

        <StatCell label="Points">
          <span className="operator-hud__points">{hud.points.toLocaleString()}</span>
          <span className="operator-hud__suffix"> / {hud.maxPoints.toLocaleString()}</span>
        </StatCell>

        <StatCell label="Flags">
          {hud.flags}
          <span className="operator-hud__suffix"> / {hud.totalFlags}</span>
        </StatCell>

        <StatCell label="First bloods">{hud.firstBloods}</StatCell>

        <OperationClock
          deadlineIso={deadline}
          totalMinutes={contest.timeBoxMinutes}
          elapsedMs={hud.elapsedMs}
        />
      </div>
    </section>
  );
}

export function useWindowEndsLabel(contest: ContestDetail) {
  const windowLeft = contest.windowDeadlineAt ?? contest.endsAt;
  return useMemo(
    () => formatCountdown(remainingMs(windowLeft)).toUpperCase(),
    [windowLeft],
  );
}
