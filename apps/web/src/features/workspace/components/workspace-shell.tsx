"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { catalogueApi } from "@/features/catalogue/catalogue-api";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { waitForGrade, waitForRun, workspaceApi } from "../workspace-api";
import { BriefPanel } from "./brief-panel";
import { G1Chat } from "./g1-chat";
import { RunPanel } from "./run-panel";
import { SubmissionSurface } from "./submission-surface";

type WorkspaceShellProps = {
  slug: string;
};

export function WorkspaceShell({ slug }: WorkspaceShellProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loadError, setLoadError] = useState<"auth" | "load" | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setGrade(null);
    setRun(null);
    try {
      const attempt = await workspaceApi.startAttempt(slug);
      const queued = await workspaceApi.submit(attempt.id, payload);
      const finished = await waitForRun(queued.runId, setRun, abort.signal);
      if (finished.status === "succeeded") {
        setGrade(await waitForGrade(queued.runId, abort.signal));
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
      <main className="p-8">
        <p className="text-sm">
          Sign in to open this exercise.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.exercise(slug))}`}
            className="underline"
          >
            Sign in
          </Link>
        </p>
      </main>
    );
  }

  if (loadError === "load") {
    return (
      <main className="p-8">
        <p className="text-sm">Could not load this exercise.</p>
      </main>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-57px)] grid-cols-1 lg:grid-cols-[minmax(16rem,22rem)_1fr_minmax(16rem,22rem)]">
      <BriefPanel exercise={exercise} />
      <div className="flex min-h-0 flex-col">
        {exercise?.slug === "grd-001-break-the-concierge" ? (
          <G1Chat disabled={!exercise || pending} />
        ) : null}
        <SubmissionSurface
          schema={exercise?.submissionSchema}
          disabled={!exercise || pending}
          pending={pending}
          error={submitError}
          onSubmit={onSubmit}
        />
      </div>
      <RunPanel run={run} grade={grade} />
    </div>
  );
}
