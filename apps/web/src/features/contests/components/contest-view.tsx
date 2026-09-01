"use client";

import Link from "next/link";
import { useState } from "react";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import type { ContestDetail } from "@/types/contest";
import { contestsApi } from "../contests-api";

type ContestViewProps = {
  initial: ContestDetail;
};

export function ContestView({ initial }: ContestViewProps) {
  const [contest, setContest] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEnter() {
    setPending(true);
    setError(null);
    try {
      const next = await contestsApi.enter(contest.slug);
      setContest(next);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 403) {
        setError("Upgrade to Pro to enter contests.");
        return;
      }
      setError(
        caught instanceof Error ? caught.message : "Could not enter this contest.",
      );
    } finally {
      setPending(false);
    }
  }

  const nextProblem = contest.problems.find((problem) => !problem.scored);

  return (
    <div className="lp-page lp-page-catalogue">
      <header className="lp-cat-header">
        <p className="lp-panel-eyebrow">Contest</p>
        <h1 className="lp-cat-title">{contest.title}</h1>
        <p className="lp-cat-lead">{contest.intent}</p>
        <p className="lp-cat-count">
          {contest.timeBoxMinutes} minute time box · {contest.sampledCount || 2}{" "}
          sampled problems
        </p>
      </header>

      {!contest.entered && contest.canEnter ? (
        <button
          type="button"
          className="lp-btn lp-btn-dark"
          disabled={pending}
          onClick={() => void onEnter()}
        >
          {pending ? "Entering…" : "Enter contest"}
        </button>
      ) : null}

      {!contest.entered && !contest.canEnter && contest.window === "open" ? (
        <p className="lp-pg-note">
          Contests are Pro only.{" "}
          <Link href={routes.billing} className="lp-link">
            Upgrade
          </Link>
        </p>
      ) : null}

      {error ? <p className="lp-pg-note">{error}</p> : null}

      {contest.entered ? (
        <>
          <p className="lp-cat-count">
            Status: {contest.status ?? "active"}
            {contest.sampleSeed ? ` · sample recorded` : null}
          </p>
          <div className="lp-grid lp-grid-catalogue">
            {contest.problems.map((problem) => (
              <article key={problem.slug} className="lp-card lp-card--exercise">
                <div className="lp-card-meta">
                  <span className="lp-badge">{problem.difficulty}</span>
                  {problem.scored ? (
                    <span className="lp-badge lp-badge--muted">
                      {problem.score ?? 0} pts
                    </span>
                  ) : null}
                </div>
                <h2 className="lp-card-title">{problem.title}</h2>
                <Link
                  href={routes.contestProblem(contest.slug, problem.slug)}
                  className="lp-card-btn"
                >
                  {problem.scored ? "Review" : "Solve"}
                </Link>
              </article>
            ))}
          </div>
          {nextProblem && contest.status === "active" ? (
            <Link
              href={routes.contestProblem(contest.slug, nextProblem.slug)}
              className="lp-btn lp-btn-dark"
            >
              Continue with next problem
            </Link>
          ) : null}
          {contest.scorecard ? (
            <section className="lp-panel" aria-label="Contest scorecard">
              <h2 className="lp-panel-title">Scorecard</h2>
              <p className="lp-cat-lead">
                Total {contest.scorecard.totalScore} · elapsed{" "}
                {Math.round(contest.scorecard.elapsedMs / 1000)}s
              </p>
              <ul className="lp-path-steps">
                {contest.scorecard.items.map((item) => (
                  <li key={item.slug}>
                    {item.slug}: {item.score} ({item.verdict})
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
