"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import { ApiError } from "@/lib/api-client";
import type { PathDetail } from "@/types/path";
import { pathsApi } from "../paths-api";

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

  if (error === "auth") {
    return (
      <p className="lp-pg-note">
        Sign in to follow a path.{" "}
        <Link href={routes.login} className="lp-link">
          Sign in
        </Link>
      </p>
    );
  }

  if (error === "missing") {
    return <p className="lp-pg-note">Path not found.</p>;
  }

  if (error === "load") {
    return <p className="lp-pg-note">Could not load this path.</p>;
  }

  if (!path) {
    return <p className="lp-pg-note">Loading…</p>;
  }

  const continueHref = path.nextSlug
    ? `${routes.exercise(path.nextSlug)}?path=${encodeURIComponent(path.slug)}`
    : null;

  return (
    <>
      <header className="lp-cat-header">
        <p className="lp-page-eyebrow">Guided path</p>
        <h1 className="lp-cat-title">{path.title}</h1>
        <p className="lp-cat-lead">{path.intent}</p>
        <p className="lp-cat-count">
          {path.passedCount} of {path.stepCount} steps passed
          {path.complete ? " · complete" : ""}
        </p>
        {continueHref ? (
          <Link href={continueHref} className="lp-card-btn lp-path-continue">
            {path.passedCount === 0 ? "Start next step" : "Continue to next unsolved"}
          </Link>
        ) : (
          <p className="lp-pg-note">Path complete. Catalogue quotas still apply.</p>
        )}
      </header>
      <ol className="lp-path-steps">
        {path.steps.map((step) => (
          <li key={step.slug} className="lp-path-step">
            <div>
              <p className="lp-path-step-meta">
                {step.position}. {SIMULATOR_LABELS[step.simulator]} ·{" "}
                {step.passed ? "Passed" : "Open"}
              </p>
              <h2 className="lp-card-title">{step.title}</h2>
            </div>
            <Link href={routes.exercise(step.slug)} className="lp-link">
              Open
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
