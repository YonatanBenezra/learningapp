"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginPath, routes } from "@/config/routes";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";
import { problemsApi } from "@/features/problems/problems-api";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { waitForGrade, waitForRun, workspaceApi } from "../workspace-api";
import { WORKER_OFFLINE_MESSAGE } from "../worker-offline-message";
import type { HintList } from "@/types/hint";
import { hintsApi } from "../hints-api";
import { GlobalLoader } from "@/components/ui/global-loader";
import { WorkspacePracticeFrame } from "@/components/layout/workspace-practice-frame";
import { BriefPanel, type BriefTab } from "./brief-panel";
import { RunPanel } from "./run-panel";
import { SubmissionSurface } from "./submission-surface";
import { WorkspaceRagFigmaShell } from "./workspace-rag-figma-shell";
import { WorkspaceGuardrailsFigmaShell } from "./workspace-guardrails-figma-shell";
import {
  ragEditorTitle,
  ragShowsSimulationLab,
  useRagFigmaWorkspace,
} from "./workspace-rag-utils";
import { useGuardrailsFigmaWorkspace } from "../guardrails-workspace-data";
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
  const [resultsCollapsed, setResultsCollapsed] = useState(onboarding);
  const [submitValid, setSubmitValid] = useState(false);
  const [labPayload, setLabPayload] = useState<Record<string, unknown>>({});
  const [hints, setHints] = useState<HintList | null>(null);
  const [authAllowed, setAuthAllowed] = useState<boolean | null>(() =>
    getAuthSnapshot().status === "authenticated" ? true : null,
  );
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.documentElement.dataset.workspace = "practice";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    setBriefCollapsed(readFlag("lp-ws-brief-collapsed"));
    if (!onboarding) {
      setResultsCollapsed(readFlag("lp-ws-results-collapsed"));
    }
  }, [onboarding]);

  useEffect(() => {
    let cancelled = false;
    ensureAuthSession().then((session) => {
      if (cancelled) {
        return;
      }
      if (session.status === "authenticated") {
        setAuthAllowed(true);
        return;
      }
      setAuthAllowed(false);
      router.replace(loginPath(routes.exercise(slug)));
    });
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  useEffect(() => {
    if (authAllowed !== true) {
      return;
    }
    let cancelled = false;
    setExercise(null);
    setLoadError(null);
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
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace(loginPath(routes.exercise(slug)));
          return;
        }
        setLoadError("load");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, authAllowed, router]);

  useEffect(() => {
    const wantsHints =
      exercise &&
      !onboarding &&
      (useRagFigmaWorkspace(exercise, onboarding) ||
        useGuardrailsFigmaWorkspace(exercise, onboarding));
    if (!wantsHints) {
      setHints(null);
      return;
    }
    let cancelled = false;
    hintsApi
      .list(slug)
      .then((result) => {
        if (!cancelled) {
          setHints(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHints(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, exercise, onboarding]);

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
      setSubmitError(
        caught instanceof Error ? caught.message : "Could not grade this run",
      );
    } finally {
      if (abortRef.current === abort) {
        setPending(false);
      }
    }
  }

  if (authAllowed !== true) {
    return null;
  }

  if (loadError === "load") {
    return (
      <main className="lp-ws-state">
        <p>Could not load this exercise.</p>
      </main>
    );
  }

  if (!exercise) {
    return <GlobalLoader fullPage label="Opening workspace…" />;
  }

  const editorLead = onboarding
    ? "A starter config is filled in. Submit to see your first scorecard."
    : "Configure the fields below and submit to grade.";
  const editorTitle =
    exercise.simulator === "rag"
      ? ragEditorTitle(exercise.submissionSchema)
      : "Submission";

  const ragFigma = useRagFigmaWorkspace(exercise, onboarding);
  const guardrailsFigma = useGuardrailsFigmaWorkspace(exercise, onboarding);

  if (guardrailsFigma) {
    return (
      <WorkspacePracticeFrame>
      <WorkspaceGuardrailsFigmaShell
        slug={slug}
        exercise={exercise}
        pathSlug={pathSlug}
        hints={hints}
        run={run}
        grade={grade}
        pending={pending}
        submitError={submitError}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onValidityChange={setSubmitValid}
        briefCollapsed={briefCollapsed}
        onToggleBriefCollapsed={toggleBriefCollapsed}
        resultsCollapsed={resultsCollapsed}
        onToggleResultsCollapsed={toggleResultsCollapsed}
      />
      </WorkspacePracticeFrame>
    );
  }

  if (ragFigma) {
    return (
      <WorkspacePracticeFrame>
      <WorkspaceRagFigmaShell
        slug={slug}
        exercise={exercise}
        pathSlug={pathSlug}
        hints={hints}
        run={run}
        grade={grade}
        pending={pending}
        submitError={submitError}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onValidityChange={setSubmitValid}
        onValuesChange={setLabPayload}
        labPayload={labPayload}
        briefCollapsed={briefCollapsed}
        onToggleBriefCollapsed={toggleBriefCollapsed}
        resultsCollapsed={resultsCollapsed}
        onToggleResultsCollapsed={toggleResultsCollapsed}
        showSimulationLab={ragShowsSimulationLab(exercise.submissionSchema)}
      />
      </WorkspacePracticeFrame>
    );
  }

  return (
    <WorkspacePracticeFrame>
      <div className={`lp-ws lp-ws--${exercise.simulator}`}>
        <WorkspaceSplit
          storageKey="lp-ws-brief-ratio"
          defaultRatio={onboarding ? 0.36 : 0.44}
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
                  <SubmissionSurface
                    schema={exercise.submissionSchema}
                    simulator={exercise.simulator}
                    disabled={pending}
                    pending={pending}
                    error={submitError}
                    initialValues={initialValues}
                    title={editorTitle}
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
                  simulator={exercise.simulator}
                  collapsed={resultsCollapsed}
                  onToggleCollapse={toggleResultsCollapsed}
                />
              }
            />
          }
        />
      </div>
    </WorkspacePracticeFrame>
  );
}
