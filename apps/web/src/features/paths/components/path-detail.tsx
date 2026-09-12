"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import { ApiError } from "@/lib/api-client";
import type { PathDetail, PathStep } from "@/types/path";
import { pathsApi } from "../paths-api";
import "../paths.css";

const DIFFICULTY_LABELS: Record<string, string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

/** Keeps the path in context so the workspace can offer the next step. */
function stepHref(pathSlug: string, exerciseSlug: string): string {
  return `${routes.exercise(exerciseSlug)}?path=${encodeURIComponent(pathSlug)}`;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PathDetailSkeleton() {
  return (
    <div className="lp-paths lp-paths-skel" aria-busy="true" aria-live="polite">
      <header className="lp-paths-hero">
        <div>
          <span className="lp-paths-skel-block lp-pd-skel-eyebrow" />
          <span className="lp-paths-skel-block lp-paths-skel-title" />
          <span className="lp-paths-skel-block lp-paths-skel-lead" />
        </div>
        <div className="lp-paths-meta">
          <span className="lp-paths-skel-block lp-paths-skel-chip" />
          <span className="lp-paths-skel-block lp-paths-skel-chip" />
        </div>
      </header>

      <span className="lp-paths-skel-block lp-pd-skel-panel" />

      <div className="lp-pd-steps">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="lp-pd-step">
            <span className="lp-paths-skel-block lp-pd-skel-mark" />
            <div className="lp-pd-step-body">
              <span className="lp-paths-skel-block lp-paths-skel-name" />
              <span className="lp-paths-skel-block lp-paths-skel-copy lp-paths-skel-copy--short" />
            </div>
            <span className="lp-paths-skel-block lp-paths-skel-btn" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepRow({
  step,
  pathSlug,
  isNext,
}: {
  step: PathStep;
  pathSlug: string;
  isNext: boolean;
}) {
  const state = step.passed ? "done" : isNext ? "next" : "open";

  return (
    <li className={`lp-pd-step is-${state}`}>
      <span className={`lp-pd-mark lp-pd-mark--${state}`} aria-hidden="true">
        {step.passed ? <CheckIcon /> : step.position}
      </span>

      <div className="lp-pd-step-body">
        <div className="lp-pd-step-head">
          <h2 className="lp-pd-step-title">{step.title}</h2>
          {step.passed ? (
            <span className="lp-paths-status lp-paths-status--done">Passed</span>
          ) : isNext ? (
            <span className="lp-paths-status lp-paths-status--active">Next</span>
          ) : null}
        </div>
        <p className="lp-pd-step-meta">
          {SIMULATOR_LABELS[step.simulator]} ·{" "}
          {DIFFICULTY_LABELS[step.difficulty] ?? step.difficulty}
        </p>
      </div>

      <Link
        href={stepHref(pathSlug, step.slug)}
        className={`lp-paths-btn${isNext && !step.passed ? "" : " lp-paths-btn--ghost"} lp-pd-step-btn`}
      >
        {step.passed ? "Review" : isNext ? "Start" : "Open"}
      </Link>
    </li>
  );
}

export function PathDetailView({ slug }: { slug: string }) {
  const [path, setPath] = useState<PathDetail | null>(null);
  const [error, setError] = useState<"auth" | "missing" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    pathsApi
      .getBySlug(slug)
      .then((result) => {
        if (!cancelled) {
          setPath(result);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        if (caught instanceof ApiError && caught.status === 401) {
          setError("auth");
          return;
        }
        if (caught instanceof ApiError && caught.status === 404) {
          setError("missing");
          return;
        }
        setError("load");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="lp-paths-error">
        <strong>
          {error === "auth"
            ? "Sign in to follow a path"
            : error === "missing"
              ? "Path not found"
              : "Could not load this path"}
        </strong>
        <p>
          {error === "auth" ? (
            <>
              Paths track which steps you have passed, so they need an account.{" "}
              <Link href={routes.login} className="lp-link">
                Sign in
              </Link>
            </>
          ) : error === "missing" ? (
            <>
              This path may have been renamed or unpublished.{" "}
              <Link href={routes.paths} className="lp-link">
                All paths
              </Link>
            </>
          ) : (
            "Check that the API is running, then refresh this page."
          )}
        </p>
      </div>
    );
  }

  if (!path) {
    return <PathDetailSkeleton />;
  }

  const percent =
    path.stepCount > 0
      ? Math.round((path.passedCount / path.stepCount) * 100)
      : 0;
  const nextStep = path.steps.find((step) => !step.passed) ?? null;
  const continueHref = path.nextSlug
    ? stepHref(path.slug, path.nextSlug)
    : null;

  return (
    <div className="lp-paths">
      <header className="lp-paths-hero">
        <div>
          <p className="lp-pd-eyebrow">Guided path</p>
          <h1 className="lp-paths-title">{path.title}</h1>
          <p className="lp-paths-lead">{path.intent}</p>
        </div>
        <div className="lp-paths-meta">
          <span
            className={`lp-paths-status lp-paths-status--${
              path.complete ? "done" : path.passedCount > 0 ? "active" : "new"
            }`}
          >
            {path.complete
              ? "Complete"
              : path.passedCount > 0
                ? "In progress"
                : "Not started"}
          </span>
          <span className="lp-paths-chip">
            {path.stepCount} step{path.stepCount === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <section className="lp-pd-progress" aria-label="Path progress">
        <div className="lp-paths-progress">
          <div className="lp-paths-progress-meta">
            <strong>
              {path.passedCount} of {path.stepCount} passed
            </strong>
            <span>{percent}%</span>
          </div>
          <div className="lp-paths-bar" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>

        {continueHref ? (
          <div className="lp-pd-progress-cta">
            <Link href={continueHref} className="lp-paths-btn">
              {path.passedCount === 0 ? "Start first step" : "Continue"}
            </Link>
            {nextStep ? (
              <p className="lp-pd-progress-next">Next: {nextStep.title}</p>
            ) : null}
          </div>
        ) : (
          <p className="lp-pd-progress-next">
            Every step passed. Catalogue quotas still apply to re-runs.
          </p>
        )}
      </section>

      <section aria-label="Path steps">
        <div className="lp-pd-section-head">
          <h2 className="lp-pd-section-title">Steps</h2>
          <p className="lp-pd-section-note">In order · one exercise at a time</p>
        </div>
        <ol className="lp-pd-steps">
          {path.steps.map((step) => (
            <StepRow
              key={step.slug}
              step={step}
              pathSlug={path.slug}
              isNext={nextStep?.slug === step.slug}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}
