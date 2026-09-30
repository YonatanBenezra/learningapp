"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import type { HintList } from "@/types/hint";
import {
  buildFigmaBriefFromExercise,
  defaultsFromSubmissionSchema,
} from "../figma-brief-from-exercise";
import { BriefPanel, type BriefTab, type FigmaBriefContent } from "./brief-panel";
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

type WorkspaceRagFigmaShellProps = {
  slug: string;
  exercise: Exercise;
  pathSlug?: string;
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
};

export function WorkspaceRagFigmaShell({
  slug,
  exercise,
  pathSlug,
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
}: WorkspaceRagFigmaShellProps) {
  const [briefTab, setBriefTab] = useState<BriefTab>("description");
  const [workTab, setWorkTab] = useState<"configure" | "lab">("configure");
  const [mobileStep, setMobileStep] = useState<WorkspaceMobileStep>("brief");
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 899px)").matches
      : false,
  );
  const [attempt, setAttempt] = useState(1);
  const [formValues, setFormValues] = useState<Record<string, unknown> | null>(null);
  const lastGradedPayloadRef = useRef<string | null>(null);

  const figmaBrief = useMemo(
    () =>
      figmaBriefOverride ??
      buildFigmaBriefFromExercise(exercise, {
        hints,
        submissionCount: Math.max(0, attempt - 1),
        thresholdFootnote: "on the hidden set · graded on submit",
      }),
    [exercise, hints, figmaBriefOverride, attempt],
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
    setAttempt((n) => n + 1);
    setFormValues(payload);
    onSubmit(payload);
  };

  const handleValuesChange = (payload: Record<string, unknown>) => {
    setFormValues(payload);
    onValuesChange(payload);
  };

  const rootClass = `lp-ws lp-ws--rag lp-ws--figma${demoMode ? " lp-ws--demo" : ""}${isMobileLayout ? " lp-ws--mobile" : ""}`;

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
            collapsed={briefCollapsed}
            tab={briefTab}
            onTabChange={setBriefTab}
            onToggleCollapse={onToggleBriefCollapsed}
            figmaBrief={figmaBrief}
            backLabel="Problems"
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
                />
                <div className="lp-ws-work-pane" hidden={workTab !== "configure"}>
                  <WorkspaceSplit
                    direction="vertical"
                    storageKey={
                      demoMode ? "lp-ws-demo-flow-ratio" : "lp-ws-live-flow-ratio-v1"
                    }
                    defaultRatio={0.54}
                    minPrimary={220}
                    minSecondary={200}
                    ratioMin={0.38}
                    ratioMax={0.72}
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
                        figmaAttempt={attempt}
                      />
                    }
                  />
                </div>
                {workTab === "lab" ? (
                  showSimulationLab ? (
                    <RagLabPanel slug={slug} payload={labPayload ?? formDefaults} />
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
              />
            }
          />
        }
      />
    </div>
  );
}
