"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS, type SimulatorSlug } from "@/config/simulators";
import { authApi } from "@/features/auth/auth-api";
import { progressApi } from "@/features/progress/progress-api";
import { ApiError } from "@/lib/api-client";
import type { Progress } from "@/types/progress";
import type { User } from "@/types/user";
import "../progress-studio.css";

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

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function pillClass(verdict: string | null) {
  const value = verdict?.toLowerCase();
  if (value === "fail") {
    return "lp-prog-pill--fail";
  }
  if (value === "pass") {
    return "lp-prog-pill--pass";
  }
  return "";
}

export function ProgressView() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([progressApi.getMine(), authApi.me()])
      .then(([mine, me]) => {
        if (!cancelled) {
          setProgress(mine);
          setUser(me);
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

  if (error === "auth") {
    return (
      <div className="lp-prog">
        <header className="lp-prog-hero">
          <div>
            <h1 className="lp-prog-title">Progress</h1>
            <p className="lp-prog-lead">
              Today&apos;s drill, streak, skills, and solve history.
            </p>
          </div>
        </header>
        <div className="lp-prog-error">
          <strong>Sign in required</strong>
          <p>
            Sign in to view your progress.{" "}
            <Link
              href={`${routes.login}?next=${encodeURIComponent(routes.progress)}`}
              className="lp-prog-link"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-prog">
        <header className="lp-prog-hero">
          <div>
            <h1 className="lp-prog-title">Progress</h1>
            <p className="lp-prog-lead">
              Today&apos;s drill, streak, skills, and solve history.
            </p>
          </div>
        </header>
        <div className="lp-prog-error">
          <strong>Could not load progress</strong>
          <p>Check that the API is running, then refresh this page.</p>
        </div>
      </div>
    );
  }

  if (!progress || !user) {
    return <GlobalLoader contained />;
  }

  const drill = progress.dailyDrill;
  const streak = progress.streak;
  const account = user.account;
  const period =
    account?.limits.periodKind === "rolling_30d" ? "this month" : "this week";
  const scoredSkills = progress.skills.filter((skill) => skill.score > 0).length;
  const simulatorLabel =
    drill && drill.simulator in SIMULATOR_LABELS
      ? SIMULATOR_LABELS[drill.simulator as SimulatorSlug]
      : drill?.simulator;

  return (
    <div className="lp-prog">
      <header className="lp-prog-hero">
        <div>
          <h1 className="lp-prog-title">Progress</h1>
          <p className="lp-prog-lead">
            Today&apos;s drill, your streak, skill scores, and a timeline of
            recent solves.
          </p>
        </div>
        <div className="lp-prog-meta">
          <span className="lp-prog-chip lp-prog-chip--brand">
            {progress.solves} solve{progress.solves === 1 ? "" : "s"}
          </span>
          <span className="lp-prog-chip">
            {streak.current} day streak
          </span>
          {account ? (
            <span className="lp-prog-chip">{account.tier} plan</span>
          ) : null}
        </div>
      </header>

      <div className="lp-prog-top">
        <section className="lp-prog-panel lp-prog-panel--drill" id="daily-drill">
          <div className="lp-prog-panel-head">
            <div>
              <p className="lp-prog-kicker">Habit</p>
              <h2 className="lp-prog-panel-title">Daily drill</h2>
            </div>
          </div>

          <div className="lp-prog-drill">
            <div>
              {!drill ? (
                <p className="lp-prog-empty">No published drill today.</p>
              ) : (
                <>
                  <p className="lp-prog-drill-date">
                    One short exercise · {drill.date}
                    {drill.completed ? " · done" : ""}
                  </p>
                  <h3 className="lp-prog-drill-title">{drill.title}</h3>
                  <p className="lp-prog-drill-meta">
                    {simulatorLabel} · {difficultyLabel(drill.difficulty)}
                  </p>
                  <div className="lp-prog-actions">
                    <Link
                      href={routes.exercise(drill.slug)}
                      className="lp-prog-btn"
                    >
                      {drill.completed ? "Practice again" : "Start today's drill"}
                    </Link>
                    <Link href={routes.catalogue} className="lp-prog-btn lp-prog-btn--ghost">
                      Browse catalogue
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="lp-prog-streak" aria-live="polite">
              <strong>{streak.current}</strong>
              <span>
                day streak
                {streak.longest > 0 ? ` · best ${streak.longest}` : ""}
              </span>
            </div>
          </div>
        </section>

        <section className="lp-prog-panel" aria-label="Quota">
          <div className="lp-prog-panel-head">
            <div>
              <p className="lp-prog-kicker">Plan</p>
              <h2 className="lp-prog-panel-title">Quota</h2>
            </div>
            <p className="lp-prog-note">{period}</p>
          </div>

          {account ? (
            <>
              <div className="lp-prog-stats">
                <div className="lp-prog-stat">
                  <strong>{account.tier}</strong>
                  <span>Tier</span>
                </div>
                <div className="lp-prog-stat lp-prog-stat--accent">
                  <strong>{account.attemptsRemaining}</strong>
                  <span>left</span>
                </div>
                <div className="lp-prog-stat">
                  <strong>
                    {account.attemptsThisPeriod}/{account.limits.attemptsPerPeriod}
                  </strong>
                  <span>used</span>
                </div>
              </div>
              {account.quotaExceeded ? (
                <p className="lp-prog-empty">
                  You are at the {account.tier === "pro" ? "fair-use" : "free"}{" "}
                  cap.{" "}
                  <Link href={routes.billing} className="lp-prog-link">
                    {account.tier === "pro" ? "Manage billing" : "Upgrade to Pro"}
                  </Link>
                </p>
              ) : null}
            </>
          ) : (
            <p className="lp-prog-empty">Quota unavailable.</p>
          )}
        </section>
      </div>

      <div className="lp-prog-layout">
        <section className="lp-prog-panel" aria-label="Skills">
          <div className="lp-prog-panel-head">
            <div>
              <p className="lp-prog-kicker">Competency</p>
              <h2 className="lp-prog-panel-title">Skill scores</h2>
            </div>
            <p className="lp-prog-note">
              {scoredSkills} scored · {progress.attempts} attempts
            </p>
          </div>

          {progress.skills.length === 0 ? (
            <p className="lp-prog-empty">No skill scores yet.</p>
          ) : (
            <div className="lp-prog-skills">
              {progress.skills.map((skill) => {
                const blank = skill.score <= 0;
                const width = Math.max(0, Math.min(skill.score, 1)) * 100;
                return (
                  <div key={skill.slug} className="lp-prog-skill">
                    <div className="lp-prog-skill-top">
                      <p className="lp-prog-skill-name">{skill.name}</p>
                      <span
                        className={`lp-prog-skill-score${blank ? " is-empty" : ""}`}
                      >
                        {blank ? "—" : skill.score.toFixed(2)}
                      </span>
                    </div>
                    <div className="lp-prog-bar" aria-hidden="true">
                      <span style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lp-prog-panel" aria-label="Solve history">
          <div className="lp-prog-panel-head">
            <div>
              <p className="lp-prog-kicker">Timeline</p>
              <h2 className="lp-prog-panel-title">Solve history</h2>
            </div>
            <p className="lp-prog-note">{progress.items.length} recent</p>
          </div>

          {progress.items.length === 0 ? (
            <p className="lp-prog-empty">No attempts yet.</p>
          ) : (
            <ul className="lp-prog-attempts">
              {progress.items.map((item) => (
                <li key={item.attemptId} className="lp-prog-attempt">
                  <div>
                    <p className="lp-prog-attempt-title">
                      <Link href={routes.exercise(item.exerciseSlug)}>
                        {item.title}
                      </Link>
                    </p>
                    <div className="lp-prog-attempt-meta">
                      <span>{item.status}</span>
                      <span>·</span>
                      <span>
                        {item.startedAt ? formatWhen(item.startedAt) : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="lp-prog-attempt-side">
                    <span className={`lp-prog-pill ${pillClass(item.verdict)}`}>
                      {item.verdict ?? item.status}
                    </span>
                    {item.runId ? (
                      <span className="lp-prog-attempt-links">
                        <Link href={routes.run(item.runId)}>Run</Link>
                        <Link href={routes.trace(item.runId)}>Trace</Link>
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
