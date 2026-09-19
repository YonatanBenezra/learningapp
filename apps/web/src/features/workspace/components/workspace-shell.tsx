"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginPath, routes } from "@/config/routes";
import { ensureAuthSession } from "@/features/auth/auth-session";
import { problemsApi } from "@/features/problems/problems-api";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { onboardingApi } from "@/features/onboarding/onboarding-api";
import { waitForGrade, waitForRun, workspaceApi } from "../workspace-api";
import { WORKER_OFFLINE_MESSAGE } from "../worker-offline-message";
import { BriefPanel, type BriefTab } from "./brief-panel";
import { G1Chat } from "./g1-chat";
import { RunPanel } from "./run-panel";
import { SubmissionSurface } from "./submission-surface";
import { WorkspaceSplit } from "./workspace-split";
import {
  dispatchWorkspaceState,
  WS_EVENTS,
} from "../workspace-events";
import "../workspace.css";

type WorkspaceShellProps = {
  slug: string;
  initialValues?: Record<string, unknown>;
  onboarding?: boolean;
  pathSlug?: string;
  onSessionChange?: (session: {
    run: Run | null;
    grade: Grade | null;
    pending: boolean;
  }) => void;
};

function readFlag(key: string) {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(key) === "1";
}

export function WorkspaceShell({
  slug,
  initialValues,
  onboarding = false,
  pathSlug,
  onSessionChange,
}: WorkspaceShellProps) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loadError, setLoadError] = useState<"load" | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [briefTab, setBriefTab] = useState<BriefTab>("description");
  const [briefCollapsed, setBriefCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const [submitValid, setSubmitValid] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setBriefCollapsed(readFlag("lp-ws-brief-collapsed"));
    setResultsCollapsed(readFlag("lp-ws-results-collapsed"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    problemsApi
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
        setLoadError("load");
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

  useEffect(() => {
    onSessionChange?.({ run, grade, pending });
  }, [run, grade, pending, onSessionChange]);

  useEffect(() => {
    dispatchWorkspaceState({
      pending,
      disabled: !exercise || !submitValid,
    });
  }, [pending, exercise, submitValid]);

  function toggleBriefCollapsed() {
    setBriefCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("lp-ws-brief-collapsed", next ? "1" : "0");
      return next;
    });
  }

  function toggleResultsCollapsed() {
    setResultsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("lp-ws-results-collapsed", next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    const onSubmitRequest = () => {
      (
        document.getElementById("lp-ws-submit-form") as HTMLFormElement | null
      )?.requestSubmit();
    };
    const onToggleBrief = () => {
      toggleBriefCollapsed();
    };
    window.addEventListener(WS_EVENTS.submit, onSubmitRequest);
    window.addEventListener(WS_EVENTS.toggleBrief, onToggleBrief);
    return () => {
      window.removeEventListener(WS_EVENTS.submit, onSubmitRequest);
      window.removeEventListener(WS_EVENTS.toggleBrief, onToggleBrief);
    };
  }, []);

  async function onSubmit(payload: Record<string, unknown>) {
    const session = await ensureAuthSession();
    if (session.status !== "authenticated") {
      router.push(loginPath(routes.exercise(slug)));
      return;
    }

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setPending(true);
    setSubmitError(null);
    setGrade(null);
    setRun(null);
    if (resultsCollapsed) {
      setResultsCollapsed(false);
      window.localStorage.setItem("lp-ws-results-collapsed", "0");
    }
    try {
      const attempt = await workspaceApi.startAttempt(slug);
      const queued = await workspaceApi.submit(attempt.id, payload);
      const finished = await waitForRun(
        queued.runId,
        setRun,
        abort.signal,
        () => {
          setSubmitError(WORKER_OFFLINE_MESSAGE);
        },
      );
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
      setSubmitError(
        caught instanceof Error ? caught.message : "Could not grade this run",
      );
    } finally {
      if (abortRef.current === abort) {
        setPending(false);
      }
    }
  }

  if (loadError === "load") {
    return (
      <main className="lp-ws-state">
        <p>Could not load this exercise.</p>
      </main>
    );
  }

  const editorLead =
    onboarding
      ? "A starter config is filled in. Submit to see your first scorecard."
      : exercise?.simulator === "rag"
        ? "Tune chunking and retrieval settings, then submit to grade."
        : exercise?.simulator === "evaluation"
          ? "Author assertions, a judge, or a slice spec — then submit."
          : exercise?.simulator === "guardrails"
            ? "Author an attack, inject page, or defense stack — then submit."
            : "Configure the fields below and submit to grade.";

  return (
    <div className={`lp-ws${exercise ? ` lp-ws--${exercise.simulator}` : ""}`}>
      <WorkspaceSplit
        storageKey="lp-ws-brief-ratio"
        defaultRatio={0.44}
        minPrimary={300}
        minSecondary={380}
        primaryCollapsed={briefCollapsed}
        primary={
          <BriefPanel
            exercise={exercise}
            onboarding={onboarding}
            pathSlug={pathSlug}
            collapsed={briefCollapsed}
            tab={briefTab}
            onTabChange={setBriefTab}
            onToggleCollapse={toggleBriefCollapsed}
          />
        }
        secondary={
          <WorkspaceSplit
            direction="vertical"
            storageKey="lp-ws-editor-ratio"
            defaultRatio={0.68}
            minPrimary={200}
            minSecondary={140}
            className="lp-ws-split--stack"
            secondaryCollapsed={resultsCollapsed}
            primary={
              <div className="lp-ws-pane lp-ws-pane--work">
                {exercise?.slug === "grd-001-break-the-concierge" ? (
                  <G1Chat disabled={!exercise || pending} />
                ) : null}
                <SubmissionSurface
                  schema={exercise?.submissionSchema}
                  simulator={exercise?.simulator}
                  disabled={!exercise || pending}
                  pending={pending}
                  error={submitError}
                  initialValues={initialValues}
                  title="Code"
                  lead={editorLead}
                  onSubmit={onSubmit}
                  onValidityChange={setSubmitValid}
                />
              </div>
            }
            secondary={
              <RunPanel
                run={run}
                grade={grade}
                onboarding={onboarding}
                simulator={exercise?.simulator}
                collapsed={resultsCollapsed}
                onToggleCollapse={toggleResultsCollapsed}
              />
            }
          />
        }
      />
    </div>
  );
}
