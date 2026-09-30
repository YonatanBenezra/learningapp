"use client";

import { useCallback, useMemo, useState } from "react";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import {
  DEMO_EXERCISE,
  DEMO_FIGMA,
  DEMO_GRADE_FAIL,
  DEMO_RUN,
  DEMO_STARTER,
} from "../demo/rag-workspace-demo-data";
import { WorkspaceRagFigmaShell } from "./workspace-rag-figma-shell";
import "../demo/workspace-demo.css";

export function WorkspaceDemoShell() {
  const exercise = DEMO_EXERCISE;
  const [briefCollapsed, setBriefCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const [pending, setPending] = useState(false);
  const [run, setRun] = useState<Run | null>(DEMO_RUN);
  const [grade, setGrade] = useState<Grade | null>(DEMO_GRADE_FAIL);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const demoInitial = useMemo(() => ({ ...DEMO_STARTER }), []);
  const [labPayload, setLabPayload] = useState<Record<string, unknown>>(demoInitial);

  const onSubmit = useCallback((payload: Record<string, unknown>) => {
    void payload;
    setPending(true);
    setSubmitError(null);
    window.setTimeout(() => {
      setRun(DEMO_RUN);
      setGrade(DEMO_GRADE_FAIL);
      setPending(false);
    }, 900);
  }, []);

  return (
    <WorkspaceRagFigmaShell
      slug={exercise.slug}
      exercise={exercise}
      hints={null}
      run={run}
      grade={grade}
      pending={pending}
      submitError={submitError}
      initialValues={demoInitial}
      onSubmit={onSubmit}
      onValidityChange={() => undefined}
      onValuesChange={setLabPayload}
      labPayload={labPayload}
      briefCollapsed={briefCollapsed}
      onToggleBriefCollapsed={() => setBriefCollapsed((v) => !v)}
      resultsCollapsed={resultsCollapsed}
      onToggleResultsCollapsed={() => setResultsCollapsed((v) => !v)}
      showSimulationLab={false}
      demoMode
      figmaBrief={DEMO_FIGMA}
      labPlaceholder={
        <div className="lp-ws-demo-lab-placeholder">
          <p>
            <strong>Simulation Lab</strong> lands in the next pass — corpus preview, chunk
            browser, and retrieval dry-run.
          </p>
        </div>
      }
    />
  );
}
