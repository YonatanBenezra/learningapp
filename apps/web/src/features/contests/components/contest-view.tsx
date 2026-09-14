"use client";

import Link from "next/link";
import { useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS, type SimulatorSlug } from "@/config/simulators";
import { ApiError } from "@/lib/api-client";
import type { ContestDetail, ContestProblem } from "@/types/contest";
import {
  sittingConfig,
  type SittingVariant,
} from "@/features/sittings/sitting-config";
import { ViewToggle, type LayoutView } from "./view-toggle";
import "../contests.css";

type ContestViewProps = {
  initial: ContestDetail;
  variant?: SittingVariant;
};

const DIFFICULTY_LABELS: Record<string, string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

const STATUS_LABELS: Record<string, string> = {
  active: "In progress",
  finished: "Finished",
  expired: "Time expired",
};

// Fixed locale + UTC so the server and the client render the same string.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : dateFormat.format(parsed);
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function simulatorLabel(value: string): string {
  return SIMULATOR_LABELS[value as SimulatorSlug] ?? value;
}

function sittingEnterTitle(
  contest: ContestDetail,
  labels: ReturnType<typeof sittingConfig>["labels"],
  variant: SittingVariant,
) {
  if (contest.canEnter) {
    return labels.enterTitle;
  }
  if (contest.window === "open") {
    return labels.proOnlyTitle;
  }
  if (variant === "assessment") {
    return "This assessment window is not open";
  }
  return "This contest is not open";
}

function sittingEnterCopy(
  contest: ContestDetail,
  labels: ReturnType<typeof sittingConfig>["labels"],
) {
  if (contest.canEnter) {
    return `${contest.sampledCount || 4} problems are sampled from a hidden pool of ${contest.problemCount}. Hints stay off for the whole ${contest.timeBoxMinutes}-minute box.`;
  }
  if (contest.window === "open") {
    return labels.proOnlyCopy;
  }
  if (contest.window === "upcoming") {
    return `Opens ${formatDate(contest.startsAt)}.`;
  }
  return `Closed ${formatDate(contest.endsAt)}.`;
}

function SittingEnterAction({
  contest,
  pending,
  onEnter,
  labels,
  className = "lp-ct-btn",
}: {
  contest: ContestDetail;
  pending: boolean;
  onEnter: () => void;
  labels: ReturnType<typeof sittingConfig>["labels"];
  className?: string;
}) {
  if (contest.canEnter) {
    return (
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={onEnter}
      >
        {pending ? labels.enterPending : labels.enterAction}
      </button>
    );
  }
  if (contest.window === "open") {
    return (
      <Link href={routes.billing} className={className}>
        Upgrade to Pro
      </Link>
    );
  }
  return null;
}

function SittingEnterGrid({
  contest,
  labels,
  variant,
  pending,
  onEnter,
}: {
  contest: ContestDetail;
  labels: ReturnType<typeof sittingConfig>["labels"];
  variant: SittingVariant;
  pending: boolean;
  onEnter: () => void;
}) {
  const sampled = contest.sampledCount || 4;

  return (
    <div className="lp-ctd-enter-grid">
      <article className="lp-ctd-enter-card">
        <h2 className="lp-ctd-enter-title">{sittingEnterTitle(contest, labels, variant)}</h2>
        <p className="lp-ctd-enter-copy">{sittingEnterCopy(contest, labels)}</p>
      </article>

      <article className="lp-ctd-enter-card lp-ctd-enter-card--stat">
        <strong>{contest.timeBoxMinutes} min</strong>
        <span>Time box</span>
      </article>

      <article className="lp-ctd-enter-card lp-ctd-enter-card--stat">
        <strong>{sampled}</strong>
        <span>Sampled</span>
        <p className="lp-ctd-enter-card-note">Pool of {contest.problemCount}</p>
      </article>

      <article className="lp-ctd-enter-card lp-ctd-enter-card--action">
        <p className="lp-ctd-enter-card-note">
          {contest.canEnter || contest.window === "open"
            ? "Hints off · traces unlock when the sitting closes"
            : sittingEnterCopy(contest, labels)}
        </p>
        <SittingEnterAction
          contest={contest}
          pending={pending}
          onEnter={onEnter}
          labels={labels}
          className="lp-ct-btn lp-ctd-enter-card-btn"
        />
      </article>
    </div>
  );
}

function ProblemCard({
  contestSlug,
  problem,
  entryOver,
  problemHref,
}: {
  contestSlug: string;
  problem: ContestProblem;
  entryOver: boolean;
  problemHref: (contestSlug: string, exerciseSlug: string) => string;
}) {
  return (
    <article
      className={`lp-ctd-card${problem.scored ? " is-scored" : ""}`}
    >
      <div className="lp-ct-card-top">
        <span className="lp-ct-badge">
          {DIFFICULTY_LABELS[problem.difficulty] ?? problem.difficulty}
        </span>
        {problem.scored ? (
          <span
            className={`lp-ctd-verdict lp-ctd-verdict--${
              problem.verdict ?? "unknown"
            }`}
          >
            {problem.verdict ?? "scored"} · {problem.score ?? 0} pts
          </span>
        ) : (
          <span className="lp-ctd-verdict lp-ctd-verdict--todo">Not solved</span>
        )}
      </div>

      <h3 className="lp-ct-card-title">{problem.title}</h3>
      <p className="lp-ct-card-copy">{simulatorLabel(problem.simulator)}</p>

      {entryOver ? (
        <span className="lp-ctd-card-closed">
          {problem.scored ? "Scored" : "Not attempted"}
        </span>
      ) : (
        <Link
          href={problemHref(contestSlug, problem.slug)}
          className={`lp-ct-btn${problem.scored ? " lp-ct-btn--ghost" : ""} lp-ctd-card-btn`}
        >
          {problem.scored ? "Review" : "Solve"}
        </Link>
      )}
    </article>
  );
}

export function ContestView({ initial, variant = "contest" }: ContestViewProps) {
  const { api, problemHref, labels } = sittingConfig(variant);
  const [contest, setContest] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerLayout, setBannerLayout] = useState<LayoutView>("list");

  async function onEnter() {
    setPending(true);
    setError(null);
    try {
      const next = await api.enter(contest.slug);
      setContest(next);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 403) {
        setError(labels.upgradeError);
        return;
      }
      setError(
        caught instanceof Error ? caught.message : labels.enterError,
      );
    } finally {
      setPending(false);
    }
  }

  const entryOver =
    contest.entered &&
    (contest.status === "expired" || contest.status === "finished");
  const nextProblem = contest.problems.find((problem) => !problem.scored);
  const solved = contest.problems.filter((problem) => problem.scored).length;
  const score = contest.scorecard?.totalScore ?? contest.totalScore;
  const elapsed = contest.scorecard?.elapsedMs ?? contest.elapsedMs;

  return (
    <div className="lp-ct">
      <header className="lp-ct-hero">
        <div>
          <p className="lp-ct-eyebrow">{labels.eyebrow}</p>
          <h1 className="lp-ct-title">{contest.title}</h1>
          <p className="lp-ct-lead">{contest.intent}</p>
        </div>
        <div className="lp-ct-meta">
          <span className={`lp-ct-badge lp-ct-badge--${contest.window}`}>
            {contest.window}
          </span>
          {contest.entered ? (
            <span className="lp-ct-badge lp-ct-badge--entered">
              {STATUS_LABELS[contest.status ?? "active"] ?? "Entered"}
            </span>
          ) : null}
          <span className="lp-ct-chip">Hints off</span>
        </div>
      </header>

      <div className="lp-ctd-facts">
        <div className="lp-ct-fact">
          <strong>{contest.timeBoxMinutes} min</strong>
          <span>Time box</span>
        </div>
        <div className="lp-ct-fact">
          <strong>{contest.sampledCount || contest.problems.length}</strong>
          <span>Sampled</span>
        </div>
        <div className="lp-ct-fact">
          <strong>
            {contest.entered ? `${solved} / ${contest.problems.length}` : "—"}
          </strong>
          <span>Solved</span>
        </div>
        <div className="lp-ct-fact">
          <strong>{score ?? "—"}</strong>
          <span>Score</span>
        </div>
        <div className="lp-ct-fact">
          <strong>{elapsed !== null ? formatElapsed(elapsed) : "—"}</strong>
          <span>Elapsed</span>
        </div>
        <div className="lp-ct-fact">
          <strong>{formatDate(contest.endsAt)}</strong>
          <span>Closes</span>
        </div>
      </div>

      {error ? <p className="lp-ctd-alert">{error}</p> : null}

      {!contest.entered ? (
        <section className="lp-ctd-enter-block" aria-label={labels.enterAction}>
          <div className="lp-ctd-enter-toolbar">
            <ViewToggle
              view={bannerLayout}
              onChange={setBannerLayout}
              label="Sitting banner layout"
            />
          </div>
          {bannerLayout === "grid" ? (
            <SittingEnterGrid
              contest={contest}
              labels={labels}
              variant={variant}
              pending={pending}
              onEnter={() => void onEnter()}
            />
          ) : (
            <div className="lp-ctd-enter">
              <div>
                <h2 className="lp-ctd-enter-title">
                  {sittingEnterTitle(contest, labels, variant)}
                </h2>
                <p className="lp-ctd-enter-copy">
                  {sittingEnterCopy(contest, labels)}
                </p>
              </div>
              <SittingEnterAction
                contest={contest}
                pending={pending}
                onEnter={() => void onEnter()}
                labels={labels}
              />
            </div>
          )}
        </section>
      ) : null}

      {contest.entered ? (
        <section aria-label={labels.problemsSection}>
          <div className="lp-ctd-section-head">
            <div>
              <h2 className="lp-ctd-section-title">Problems</h2>
              <p className="lp-ctd-section-note">
                {contest.sampleSeed
                  ? "Sampled for you · pool stays hidden"
                  : "Sampled for you"}
              </p>
            </div>
            {nextProblem && contest.status === "active" ? (
              <Link
                href={problemHref(contest.slug, nextProblem.slug)}
                className="lp-ct-btn"
              >
                Continue
              </Link>
            ) : null}
          </div>

          {entryOver ? (
            <p className="lp-ctd-notice">
              {contest.status === "expired"
                ? `Your ${contest.timeBoxMinutes}-minute time box ran out, so this entry is closed. The problems can no longer be opened.`
                : "This entry is finished. The problems can no longer be opened."}
            </p>
          ) : null}

          <div className="lp-ctd-grid">
            {contest.problems.map((problem) => (
              <ProblemCard
                key={problem.slug}
                contestSlug={contest.slug}
                problem={problem}
                entryOver={entryOver}
                problemHref={problemHref}
              />
            ))}
          </div>
        </section>
      ) : null}

      {contest.scorecard ? (
        <section aria-label={labels.scorecardSection}>
          <div className="lp-ctd-section-head">
            <div>
              <h2 className="lp-ctd-section-title">{labels.scorecardSection}</h2>
              <p className="lp-ctd-section-note">
                Total {contest.scorecard.totalScore} ·{" "}
                {formatElapsed(contest.scorecard.elapsedMs)} elapsed
              </p>
            </div>
          </div>
          <div className="lp-ctd-table-wrap">
            <table className="lp-ctd-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Verdict</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {contest.scorecard.items.map((item) => (
                  <tr key={item.slug}>
                    <td>
                      {contest.problems.find((row) => row.slug === item.slug)
                        ?.title ?? item.slug}
                    </td>
                    <td>
                      <span
                        className={`lp-ctd-verdict lp-ctd-verdict--${item.verdict}`}
                      >
                        {item.verdict}
                      </span>
                    </td>
                    <td className="lp-ctd-table-score">{item.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
