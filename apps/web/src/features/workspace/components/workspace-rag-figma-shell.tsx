"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import type { SubmissionHistoryItem } from "@/types/submission";
import type { HintList } from "@/types/hint";
import {
  buildFigmaBriefFromExercise,
  defaultsFromSubmissionSchema,
} from "../figma-brief-from-exercise";
import { gateSummary } from "../submission-diff";
import { workspaceApi } from "../workspace-api";
import {
  BriefPanel,
  type BriefTab,
  type FigmaBriefContent,
  type FigmaBriefSubmission,
} from "./brief-panel";
import { RagFlowGraph } from "./rag-flow-graph";
import { RagLabPanel } from "./rag-lab-panel";
import { RunPanel } from "./run-panel";
import { SubmissionSurface } from "./submission-surface";
import { WorkspaceSplit } from "./workspace-split";
import { WorkspaceWorkTabs } from "./workspace-work-tabs";
import {
  WorkspaceDemoMobile,
  type WorkspaceMobileStep,
} from "./workspace-demo-mobile";
import { ragEditorTitle } from "./workspace-rag-utils";
import "../workspace.css";
import "../workspace-figma.css";
import "../workspace-rag-figma.css";
import "../workspace-guardrails-figma.css";

type WorkspaceRagFigmaShellProps = {
  slug: string;
  exercise: Exercise;
  pathSlug?: string;
  backHref?: string;
  hints?: HintList | null;
  run: Run | null;
  grade: Grade | null;
  pending: boolean;
  submitError: string | null;
  initialValues?: Record<string, unknown>;
  onSubmit: (payload: Record<string, unknown>) => void;
  onValidityChange: (valid: boolean) => void;
  onValuesChange: (payload: Record<string, unknown>) => void;
  labPayload?: Record<string, unknown>;
  briefCollapsed: boolean;
  onToggleBriefCollapsed: () => void;
  resultsCollapsed: boolean;
  onToggleResultsCollapsed: () => void;
  showSimulationLab?: boolean;
  demoMode?: boolean;
  labPlaceholder?: React.ReactNode;
  figmaBrief?: FigmaBriefContent;
  onUnlockHint?: () => Promise<void>;
};

/** Server history (newest first) -> brief rows numbered from the oldest. */
function historyRows(history: SubmissionHistoryItem[]): FigmaBriefSubmission[] {
  const total = history.length;
  return history.map((item, index) => ({
    id: item.submissionId,
    runId: item.run?.id ?? null,
    n: total - index,
    status: item.run?.status ?? "queued",
    verdict: item.grade?.verdict ?? null,
    summary: item.grade ? gateSummary(item.grade.gateResults) : "",
    createdAt: item.createdAt,
    payload: item.payload ?? {},
    gateResults: item.grade?.gateResults ?? null,
    contest: item.contest,
  }));
}

/** Matches the API's history page size. */
const HISTORY_LIMIT = 20;

export function WorkspaceRagFigmaShell({
  slug,
  exercise,
  pathSlug,
  backHref,
  hints = null,
  run,
  grade,
  pending,
  submitError,
  initialValues,
  onSubmit,
  onValidityChange,
  onValuesChange,
  labPayload,
  briefCollapsed,
  onToggleBriefCollapsed,
  resultsCollapsed,
  onToggleResultsCollapsed,
  showSimulationLab = true,
  demoMode = false,
  labPlaceholder = null,
  figmaBrief: figmaBriefOverride,
  onUnlockHint,
}: WorkspaceRagFigmaShellProps) {
  const [briefTab, setBriefTab] = useState<BriefTab>("description");
  const [workTab, setWorkTab] = useState<"configure" | "lab">("configure");
  const [mobileStep, setMobileStep] = useState<WorkspaceMobileStep>("brief");
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 899px)").matches
      : false,
  );
  /** Submissions sent from this workspace session (resets on reload). */
  const [submitCount, setSubmitCount] = useState(0);
  const [history, setHistory] = useState<SubmissionHistoryItem[] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown> | null>(null);
  const lastGradedPayloadRef = useRef<string | null>(null);

  // Reload the learner's history on open and whenever a run settles.
  const settledRunKey = run && !pending ? `${run.id}:${run.status}:${grade ? 1 : 0}` : null;
  useEffect(() => {
    if (demoMode) {
      return;
    }
    let cancelled = false;
    workspaceApi
      .listSubmissions(slug)
      .then((rows) => {
        if (!cancelled) {
          setHistory(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, settledRunKey, demoMode]);

  const submissions = useMemo(() => (history ? historyRows(history) : undefined), [history]);
  const submittedTotal = history ? history.length : submitCount;
  const historyTruncated = (history?.length ?? 0) >= HISTORY_LIMIT;

  const figmaBrief = useMemo(
    () =>
      figmaBriefOverride ??
      buildFigmaBriefFromExercise(exercise, {
        hints,
        onUnlockHint,
        submissionCount: submittedTotal,
        submissions,
        submissionsTruncated: historyTruncated,
        thresholdFootnote: "on the hidden set · graded on submit",
      }),
    [
      exercise,
      hints,
      onUnlockHint,
      figmaBriefOverride,
      submittedTotal,
      submissions,
      historyTruncated,
    ],
  );

  const initialValuesKey = JSON.stringify(initialValues ?? {});
  const formDefaults = useMemo(
    () =>
      defaultsFromSubmissionSchema(exercise.submissionSchema, initialValues),
    // initialValues content tracked via key — avoid unstable object reference loops
    [exercise.submissionSchema, initialValuesKey],
  );

  const editorTitle = ragEditorTitle(exercise.submissionSchema);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 899px)");
    function syncMobile() {
      setIsMobileLayout(media.matches);
    }
    syncMobile();
    media.addEventListener("change", syncMobile);
    return () => media.removeEventListener("change", syncMobile);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        const form = document.getElementById("lp-ws-submit-form");
        const onSubmitStep = isMobileLayout ? mobileStep === "submit" : workTab === "configure";
        if (form instanceof HTMLFormElement && onSubmitStep) {
          event.preventDefault();
          form.requestSubmit();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [workTab, isMobileLayout, mobileStep]);

  useEffect(() => {
    if (!pending && grade) {
      setMobileStep((step) => (step === "submit" ? "results" : step));
    }
  }, [pending, grade]);

  useEffect(() => {
    if (!pending && grade && formValues) {
      lastGradedPayloadRef.current = JSON.stringify(formValues);
    }
  }, [pending, grade, formValues]);

  const editedSinceRun =
    Boolean(grade) &&
    formValues != null &&
    lastGradedPayloadRef.current != null &&
    JSON.stringify(formValues) !== lastGradedPayloadRef.current;

  const handleSubmit = (payload: Record<string, unknown>) => {
    setSubmitCount((n) => n + 1);
    setFormValues(payload);
    onSubmit(payload);
  };

  const handleValuesChange = (payload: Record<string, unknown>) => {
    setFormValues(payload);
    onValuesChange(payload);
  };

  const rootClass = `lp-ws lp-ws--rag lp-ws--figma lp-ws--rag-figma${demoMode ? " lp-ws--demo" : ""}${isMobileLayout ? " lp-ws--mobile" : ""}`;

  if (isMobileLayout) {
    return (
      <div className={rootClass}>
        <WorkspaceDemoMobile
          exercise={exercise}
          figmaBrief={figmaBrief}
          step={mobileStep}
          onStepChange={setMobileStep}
          run={run}
          grade={grade}
          pending={pending}
          submitError={submitError}
          initialValues={formDefaults}
          onSubmit={handleSubmit}
          onValidityChange={onValidityChange}
          onValuesChange={handleValuesChange}
          editorTitle={editorTitle}
          nextAttempt={history ? history.length + 1 : pending ? submitCount : submitCount + 1}
          submittedAttempts={submittedTotal}
          showLab={showSimulationLab}
          labPayload={labPayload ?? formDefaults}
        />
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <WorkspaceSplit
        storageKey={demoMode ? "lp-ws-demo-brief-ratio-v2" : "lp-ws-live-brief-ratio-v1"}
        defaultRatio={0.27}
        minPrimary={240}
        minSecondary={480}
        handleVariant="pill"
        primaryCollapsed={briefCollapsed}
        primary={
          <BriefPanel
            exercise={exercise}
            pathSlug={pathSlug}
            backHref={backHref}
            collapsed={briefCollapsed}
            tab={briefTab}
            onTabChange={setBriefTab}
            onToggleCollapse={onToggleBriefCollapsed}
            figmaBrief={figmaBrief}
            backLabel={backHref ? "Contest" : "Problems"}
            hintsDisabled={Boolean(backHref)}
          />
        }
        secondary={
          <WorkspaceSplit
            storageKey={demoMode ? "lp-ws-demo-center-ratio" : "lp-ws-live-center-ratio-v1"}
            defaultRatio={0.62}
            minPrimary={340}
            minSecondary={260}
            handleVariant="pill"
            className="lp-ws-split--stack"
            primaryCollapsed={false}
            secondaryCollapsed={resultsCollapsed}
            primary={
              <div className="flex min-h-0 flex-1 flex-col lp-ws-pane lp-ws-pane--work">
                <WorkspaceWorkTabs
                  tab={workTab}
                  onTabChange={setWorkTab}
                  showLab={showSimulationLab}
                  editedSinceRun={editedSinceRun}
                  figmaStyle
                />
                <div className="lp-ws-work-pane" hidden={workTab !== "configure"}>
                  <WorkspaceSplit
                    direction="vertical"
                    storageKey={
                      demoMode ? "lp-ws-demo-flow-ratio" : "lp-ws-live-flow-ratio-v1"
                    }
                    defaultRatio={0.5}
                    minPrimary={180}
                    minSecondary={220}
                    ratioMin={0.32}
                    ratioMax={0.68}
                    handleVariant="pill"
                    className="lp-ws-split--flow"
                    primary={
                      <RagFlowGraph
                        className="lp-rag-graph--fill"
                        schema={exercise.submissionSchema}
                        pending={pending}
                        graded={Boolean(grade)}
                        verdict={grade?.verdict ?? null}
                      />
                    }
                    secondary={
                      <SubmissionSurface
                        schema={exercise.submissionSchema}
                        simulator={exercise.simulator}
                        disabled={pending}
                        pending={pending}
                        error={submitError}
                        initialValues={formDefaults}
                        title={editorTitle}
                        onSubmit={handleSubmit}
                        onValidityChange={onValidityChange}
                        onValuesChange={handleValuesChange}
                        figmaLayout
                        figmaGrade={grade}
                        figmaAttempt={
                          history ? history.length + 1 : pending ? submitCount : submitCount + 1
                        }
                      />
                    }
                  />
                </div>
                {workTab === "lab" ? (
                  showSimulationLab ? (
                    <RagLabPanel
                      slug={slug}
                      payload={labPayload ?? formDefaults}
                      gates={exercise.gates}
                    />
                  ) : (
                    labPlaceholder
                  )
                ) : null}
              </div>
            }
            secondary={
              <RunPanel
                run={run}
                grade={grade}
                simulator="rag"
                collapsed={resultsCollapsed}
                onToggleCollapse={onToggleResultsCollapsed}
                figmaScorecard
                pending={pending}
                attempt={
                  demoMode
                    ? Math.max(submitCount, figmaBrief?.submissionCount ?? 0)
                    : submittedTotal
                }
                exerciseSlug={slug}
              />
            }
          />
        }
      />
    </div>
  );
}
