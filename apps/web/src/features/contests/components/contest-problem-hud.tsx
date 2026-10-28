"use client";

import Link from "next/link";
import { ChevronLeft, Database, Lock, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import {
  formatOperationClock,
  operationElapsedMs,
} from "@/features/contests/contest-elapsed";
import { useDeadlineCountdown } from "@/features/contests/contest-clock";
import type { ContestExercise, ContestSittingClock } from "@/types/contest";
import { normalizeDifficulty } from "@/lib/arena/categories";
import "../flag-captured.css";

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "lp-ct-hud-diff--easy",
  Medium: "lp-ct-hud-diff--medium",
  Hard: "lp-ct-hud-diff--hard",
  Insane: "lp-ct-hud-diff--insane",
};

const LOW_TIME_MS = 10 * 60 * 1000;

export function ContestProblemHud({
  exercise,
  contestSlug,
  rank,
  totalPoints,
  flagsSolved,
  flagsTotal,
  problemPoints,
  entryStatus,
  personalDeadlineAt,
}: {
  exercise: ContestExercise;
  contestSlug: string;
  rank: number | null;
  totalPoints: number | null;
  flagsSolved: number;
  flagsTotal: number;
  problemPoints: number;
  entryStatus?: ContestSittingClock["entryStatus"] | null;
  personalDeadlineAt?: string | null;
}) {
  const personalRemaining = useDeadlineCountdown(personalDeadlineAt ?? null);
  const [elapsedMs, setElapsedMs] = useState(() =>
    operationElapsedMs(exercise.clock?.startedAt ?? null, undefined),
  );

  useEffect(() => {
    const tick = () => {
      setElapsedMs(
        operationElapsedMs(exercise.clock?.startedAt ?? null, undefined),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [exercise.clock?.startedAt]);

  const clockVariant = useMemo(() => {
    if (entryStatus === "expired" || entryStatus === "finished") {
      return "expired" as const;
    }
    if (personalDeadlineAt && personalRemaining != null && personalRemaining <= 0) {
      return "expired" as const;
    }
    if (personalRemaining != null && personalRemaining > 0 && personalRemaining <= LOW_TIME_MS) {
      return "low" as const;
    }
    return "active" as const;
  }, [entryStatus, personalDeadlineAt, personalRemaining]);

  const operationLabel =
    clockVariant === "expired" ? "Clock expired" : "Operation";
  const operationValue =
    clockVariant === "expired"
      ? "00:00:00"
      : formatOperationClock(elapsedMs);

  const diff = normalizeDifficulty(exercise.difficulty);
  const hintsOff = exercise.hintsDisabled;

  return (
    <header className="lp-ct-problem-hud" aria-label="Contest operation">
      <div className="lp-ct-problem-hud-bar">
        <div className="lp-ct-problem-hud-identity">
          <Link href={routes.contestPlay(contestSlug)} className="lp-ct-problem-hud-back">
            <ChevronLeft className="size-3.5" aria-hidden />
            Event
          </Link>
          <span className="lp-ct-problem-hud-lab-icon" aria-hidden>
            <Database className="size-4" strokeWidth={2} />
          </span>
          <div className="lp-ct-problem-hud-title-wrap">
            <h1 className="lp-ct-problem-hud-title">{exercise.title}</h1>
            <div className="lp-ct-problem-hud-tags">
              <span className={cnDiff(diff)}>{diff.toUpperCase()}</span>
              <span className="lp-ct-problem-hud-pts">{problemPoints} pts</span>
            </div>
          </div>
        </div>

        <div className="lp-ct-problem-hud-right">
          <div
            className={`lp-ct-problem-hud-operation lp-ct-problem-hud-clock--${clockVariant}`}
            aria-live="polite"
          >
            {clockVariant === "expired" ? (
              <Lock className="lp-ct-hud-clock-ico" aria-hidden />
            ) : (
              <Timer className="lp-ct-hud-clock-ico" aria-hidden />
            )}
            <span className="lp-ct-problem-hud-operation-label">{operationLabel}</span>
            <span className="lp-ct-problem-hud-operation-time">{operationValue}</span>
          </div>

          <dl className="lp-ct-problem-hud-stat-group">
            <div className="lp-ct-problem-hud-stat">
              <dt>Rank</dt>
              <dd>{rank != null ? `#${rank}` : "—"}</dd>
            </div>
            <div className="lp-ct-problem-hud-stat">
              <dt>Pts</dt>
              <dd className="lp-ct-problem-hud-stat-pts">
                {totalPoints != null ? totalPoints.toLocaleString() : "—"}
              </dd>
            </div>
            <div className="lp-ct-problem-hud-stat">
              <dt>Flags</dt>
              <dd>
                {flagsSolved}/{flagsTotal}
              </dd>
            </div>
          </dl>

          <div
            className="lp-ct-problem-hud-hints-btn"
            aria-label={`Hints ${hintsOff ? "off" : "on"}`}
          >
            <span className="lp-ct-problem-hud-hints-label">Hints</span>
            <span className="lp-ct-problem-hud-hints-value">{hintsOff ? "Off" : "On"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function cnDiff(diff: string): string {
  return `lp-ct-hud-diff ${DIFFICULTY_CLASS[diff] ?? "lp-ct-hud-diff--medium"}`;
}
