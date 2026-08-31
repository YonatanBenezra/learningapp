"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { catalogueApi } from "@/features/catalogue/catalogue-api";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { onboardingApi } from "@/features/onboarding/onboarding-api";
import { waitForGrade, waitForRun, workspaceApi } from "../workspace-api";
import { BriefPanel } from "./brief-panel";
import { G1Chat } from "./g1-chat";
import { RunPanel } from "./run-panel";
import { SubmissionSurface } from "./submission-surface";
import "../workspace.css";

type WorkspaceShellProps = {
  slug: string;
  initialValues?: Record<string, unknown>;
  onboarding?: boolean;
  pathSlug?: string;
};

export function WorkspaceShell({
  slug,
  initialValues,
  onboarding = false,
  pathSlug,
}: WorkspaceShellProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loadError, setLoadError] = useState<"auth" | "load" | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quotaHref, setQuotaHref] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogueApi
      .getBySlug(slug)
      .then((result) => {
        if (!cancelled) {
          setExercise(result);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setLoadError(
          caught instanceof ApiError && caught.status === 401 ? "auth" : "load",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function onSubmit(payload: Record<string, unknown>) {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setPending(true);
    setSubmitError(null);
    setQuotaHref(null);
    setGrade(null);
    setRun(null);
    try {
      const attempt = await workspaceApi.startAttempt(slug);
      const queued = await workspaceApi.submit(attempt.id, payload);
      const finished = await waitForRun(queued.runId, setRun, abort.signal);
      if (onboarding) {
        void onboardingApi.track("first_submit").catch(() => undefined);
      }
      if (finished.status === "succeeded") {
        const result = await waitForGrade(queued.runId, abort.signal);
        setGrade(result);
        if (onboarding && result.verdict === "pass") {
          void onboardingApi.track("first_pass").catch(() => undefined);
        }
      } else {
        setSubmitError(
          finished.errorMessage
            ? `Run ${finished.status}: ${finished.errorMessage}`
            : finished.errorCode
              ? `Run ${finished.status}: ${finished.errorCode}`
              : `Run ${finished.status}`,
        );
      }
    } catch (caught: unknown) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return;
      }
      if (caught instanceof ApiError && caught.status === 429) {
        setQuotaHref(routes.billing);
      }
      setSubmitError(
        caught instanceof Error ? caught.message : "Could not grade this run",
      );
    } finally {
      if (abortRef.current === abort) {
        setPending(false);
      }
    }
  }

  if (loadError === "auth") {
    return (
      <main className="lp-ws-state">
        <p>
          Sign in to open this exercise.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.exercise(slug))}`}
            className="lp-link"
          >
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  if (loadError === "load") {
    return (
      <main className="lp-ws-state">
        <p>Could not load this exercise.</p>
      </main>
    );
  }

  return (
    <div className={`lp-ws${exercise ? ` lp-ws--${exercise.simulator}` : ""}`}>
      <BriefPanel
        exercise={exercise}
        onboarding={onboarding}
        pathSlug={pathSlug}
      />
      <div className="lp-ws-pane lp-ws-pane--work">
        {exercise?.slug === "grd-001-break-the-concierge" ? (
          <G1Chat disabled={!exercise || pending} />
        ) : null}
        <SubmissionSurface
          schema={exercise?.submissionSchema}
          disabled={!exercise || pending}
          pending={pending}
          error={submitError}
          errorHref={quotaHref}
          errorLinkLabel="Upgrade"
          initialValues={initialValues}
          lead={
            onboarding
              ? "A starter config is filled in. Submit it to see your first scorecard."
              : undefined
          }
          onSubmit={onSubmit}
        />
      </div>
      <RunPanel run={run} grade={grade} onboarding={onboarding} />
    </div>
  );
}
