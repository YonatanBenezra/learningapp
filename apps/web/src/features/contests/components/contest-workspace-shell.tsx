"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { contestsApi } from "@/features/contests/contests-api";
import { BriefPanel } from "@/features/workspace/components/brief-panel";
import { RunPanel } from "@/features/workspace/components/run-panel";
import { SubmissionSurface } from "@/features/workspace/components/submission-surface";
import {
  waitForGrade,
  waitForRun,
  workspaceApi,
} from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api-client";
import type { ContestExercise } from "@/types/contest";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import "@/features/workspace/workspace.css";

type ContestWorkspaceShellProps = {
  contestSlug: string;
  exerciseSlug: string;
};

export function ContestWorkspaceShell({
  contestSlug,
  exerciseSlug,
}: ContestWorkspaceShellProps) {
  const [exercise, setExercise] = useState<ContestExercise | null>(null);
  const [loadError, setLoadError] = useState<"auth" | "load" | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quotaHref, setQuotaHref] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    contestsApi
      .getExercise(contestSlug, exerciseSlug)
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
  }, [contestSlug, exerciseSlug]);

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
      const attempt = await contestsApi.startAttempt(contestSlug, exerciseSlug);
      const queued = await workspaceApi.submit(attempt.id, payload);
      const finished = await waitForRun(queued.runId, setRun, abort.signal);
      if (finished.status === "succeeded") {
        const result = await waitForGrade(queued.runId, abort.signal);
        setGrade(result);
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
          Sign in to open this contest problem.{" "}
          <Link href={routes.login} className="lp-link">
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  if (loadError === "load") {
    return (
      <main className="lp-ws-state">
        <p>Could not load this contest problem.</p>
        <Link href={routes.contest(contestSlug)} className="lp-link">
          Back to contest
        </Link>
      </main>
    );
  }

  const panelExercise: Exercise | null = exercise
    ? {
        slug: exercise.slug,
        version: exercise.version,
        title: exercise.title,
        briefMd: exercise.briefMd,
        difficulty: exercise.difficulty as Exercise["difficulty"],
        simulator: exercise.simulator as Exercise["simulator"],
        submissionSchema: exercise.submissionSchema,
        publicSample: exercise.publicSample,
        skillTags: [],
      }
    : null;

  return (
    <div className={`lp-ws${exercise ? ` lp-ws--${exercise.simulator}` : ""}`}>
      <BriefPanel
        exercise={panelExercise}
        backHref={routes.contest(contestSlug)}
        backLabel="Contest"
        hintsDisabled={exercise?.hintsDisabled ?? true}
      />
      <div className="lp-ws-pane lp-ws-pane--work">
        <SubmissionSurface
          schema={exercise?.submissionSchema}
          disabled={!exercise || pending}
          pending={pending}
          error={submitError}
          errorHref={quotaHref}
          errorLinkLabel="Upgrade"
          onSubmit={onSubmit}
        />
      </div>
      <RunPanel run={run} grade={grade} />
    </div>
  );
}
