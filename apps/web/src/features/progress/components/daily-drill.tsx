"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS, type SimulatorSlug } from "@/config/simulators";
import { progressApi } from "@/features/progress/progress-api";
import { ApiError } from "@/lib/api-client";
import type { DailyDrill, Streak } from "@/types/progress";

export function DailyDrillCard() {
  const [drill, setDrill] = useState<DailyDrill | null | undefined>(undefined);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    progressApi
      .getMine()
      .then((result) => {
        if (!cancelled) {
          setDrill(result.dailyDrill);
          setStreak(result.streak);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setError(
          caught instanceof ApiError && caught.status === 401 ? "auth" : "load",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const simulatorLabel =
    drill && drill.simulator in SIMULATOR_LABELS
      ? SIMULATOR_LABELS[drill.simulator as SimulatorSlug]
      : drill?.simulator;

  return (
    <section className="lp-panel lp-pg-panel lp-pg-drill" id="daily-drill">
      <div className="lp-pg-drill-grid">
        <div>
          <p className="lp-panel-eyebrow">Habit</p>
          <h2 className="lp-panel-title">Daily drill</h2>
          {error === "auth" ? (
            <p className="lp-pg-note">
              Sign in to see today&apos;s drill.{" "}
              <Link
                href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
                className="lp-link"
              >
                Sign in
              </Link>
            </p>
          ) : null}
          {error === "load" ? (
            <p className="lp-pg-note">Could not load today&apos;s drill.</p>
          ) : null}
          {!error && drill === undefined ? (
            <div className="lp-pg-skel" aria-hidden="true">
              <span className="lp-skel-line" />
              <span className="lp-skel-line" />
            </div>
          ) : null}
          {drill === null ? (
            <p className="lp-pg-empty">No published drill today.</p>
          ) : null}
          {drill ? (
            <>
              <p className="lp-pg-drill-kicker">
                One short exercise · {drill.date}
                {drill.completed ? " · done" : ""}
              </p>
              <h3 className="lp-pg-drill-title">{drill.title}</h3>
              <p className="lp-pg-drill-meta">
                {simulatorLabel} · {difficultyLabel(drill.difficulty)}
              </p>
              <div className="lp-pg-actions">
                <Link
                  href={routes.exercise(drill.slug)}
                  className="lp-btn lp-btn-primary"
                >
                  {drill.completed ? "Practice again" : "Start today's drill"}
                </Link>
              </div>
            </>
          ) : null}
        </div>
        <div className="lp-pg-streak" aria-live="polite">
          <span className="lp-pg-streak-value">{streak?.current ?? "—"}</span>
          <span className="lp-pg-streak-label">
            day streak
            {streak && streak.longest > 0
              ? ` · best ${streak.longest}`
              : ""}
          </span>
        </div>
      </div>
    </section>
  );
}

function difficultyLabel(value: string) {
  if (value === "E") {
    return "Easy";
  }
  if (value === "M") {
    return "Medium";
  }
  if (value === "H") {
    return "Hard";
  }
  return value;
}
