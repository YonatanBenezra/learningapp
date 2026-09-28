"use client";

import { useCallback, useEffect, useState } from "react";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { BriefPanel, type BriefTab } from "./brief-panel";
import { RagFlowGraph } from "./rag-flow-graph";
import { RunPanel } from "./run-panel";
import { SubmissionSurface } from "./submission-surface";
import { WorkspaceSplit } from "./workspace-split";
import { WorkspaceWorkTabs } from "./workspace-work-tabs";
import {
  WorkspaceDemoMobile,
  type WorkspaceMobileStep,
} from "./workspace-demo-mobile";
import {
  DEMO_EXERCISE,
  DEMO_FIGMA,
  DEMO_GRADE_FAIL,
  DEMO_RUN,
  DEMO_STARTER,
} from "../demo/rag-workspace-demo-data";
import "../workspace.css";
import "../workspace-figma.css";
import "../demo/workspace-demo.css";

export function WorkspaceDemoShell() {
  const exercise = DEMO_EXERCISE;
  const [briefTab, setBriefTab] = useState<BriefTab>("description");
  const [briefCollapsed, setBriefCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const [pending, setPending] = useState(false);
  const [run, setRun] = useState<Run | null>(DEMO_RUN);
  const [grade, setGrade] = useState<Grade | null>(DEMO_GRADE_FAIL);
  const [workTab, setWorkTab] = useState<"configure" | "lab">("configure");
  const [mobileStep, setMobileStep] = useState<WorkspaceMobileStep>("brief");
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 899px)").matches
      : false,
  );

  const onSubmit = useCallback(
    (payload: Record<string, unknown>) => {
      void payload;
      setPending(true);
      setSubmitError(null);
      window.setTimeout(() => {
        setRun(DEMO_RUN);
        setGrade(DEMO_GRADE_FAIL);
        setPending(false);
        setMobileStep((step) => (step === "submit" ? "results" : step));
      }, 900);
    },
    [],
  );

  const [submitError, setSubmitError] = useState<string | null>(null);

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

  if (isMobileLayout) {
    return (
      <div className="lp-ws lp-ws--rag lp-ws--demo lp-ws--figma lp-ws--mobile">
        <WorkspaceDemoMobile
          exercise={exercise}
          figmaBrief={DEMO_FIGMA}
          step={mobileStep}
          onStepChange={setMobileStep}
          run={run}
          grade={grade}
          pending={pending}
          submitError={submitError}
          initialValues={{ ...DEMO_STARTER }}
          onSubmit={onSubmit}
        />
      </div>
    );
  }

  return (
    <div className="lp-ws lp-ws--rag lp-ws--demo lp-ws--figma">
      <WorkspaceSplit
        storageKey="lp-ws-demo-brief-ratio"
        defaultRatio={0.34}
        minPrimary={260}
        minSecondary={480}
        handleVariant="pill"
        primaryCollapsed={briefCollapsed}
        primary={
          <BriefPanel
            exercise={exercise}
            collapsed={briefCollapsed}
            tab={briefTab}
            onTabChange={setBriefTab}
            onToggleCollapse={() => setBriefCollapsed((v) => !v)}
            figmaBrief={DEMO_FIGMA}
            backLabel="Problems"
          />
        }
        secondary={
          <WorkspaceSplit
            storageKey="lp-ws-demo-center-ratio"
            defaultRatio={0.62}
            minPrimary={340}
            minSecondary={260}
            handleVariant="pill"
            className="lp-ws-split--stack"
            primaryCollapsed={false}
            secondaryCollapsed={resultsCollapsed}
            primary={
              <div className="flex min-h-0 flex-1 flex-col lp-ws-pane lp-ws-pane--work">
                <WorkspaceWorkTabs tab={workTab} onTabChange={setWorkTab} />
                <div className="lp-ws-work-pane" hidden={workTab !== "configure"}>
                  <WorkspaceSplit
                    direction="vertical"
                    storageKey="lp-ws-demo-flow-ratio"
                    defaultRatio={0.54}
                    minPrimary={220}
                    minSecondary={200}
                    ratioMin={0.38}
                    ratioMax={0.72}
                    handleVariant="pill"
                    className="lp-ws-split--flow"
                    primary={<RagFlowGraph className="lp-rag-graph--fill" />}
                    secondary={
                      <SubmissionSurface
                        schema={exercise.submissionSchema}
                        simulator={exercise.simulator}
                        disabled={pending}
                        pending={pending}
                        error={submitError}
                        initialValues={{ ...DEMO_STARTER }}
                        title="Chunking config"
                        onSubmit={(payload) => onSubmit(payload)}
                        figmaLayout
                        figmaGrade={grade}
                        figmaAttempt={3}
                      />
                    }
                  />
                </div>
                {workTab === "lab" ? (
                  <div className="lp-ws-demo-lab-placeholder">
                    <p>
                      <strong>Simulation Lab</strong> lands in the next pass — corpus preview,
                      chunk browser, and retrieval dry-run.
                    </p>
                  </div>
                ) : null}
              </div>
            }
            secondary={
              <RunPanel
                run={run}
                grade={grade}
                simulator="rag"
                collapsed={resultsCollapsed}
                onToggleCollapse={() => setResultsCollapsed((v) => !v)}
                figmaScorecard
              />
            }
          />
        }
      />
    </div>
  );
}
