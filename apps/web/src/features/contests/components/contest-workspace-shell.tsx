"use client";

import { useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { WorkspacePracticeFrame } from "@/components/layout/workspace-practice-frame";
import { GlobalLoader } from "@/components/ui/global-loader";
import {
  sittingConfig,
  type SittingVariant,
} from "@/features/sittings/sitting-config";
import {
  ContestState,
  contestProblemState,
} from "@/features/contests/components/contest-state";
import { ContestWorkspaceClock } from "@/features/contests/components/contest-workspace-clock";
import { ContestProblemHud } from "@/features/contests/components/contest-problem-hud";
import { FlagCapturedModal } from "@/features/contests/components/flag-captured-modal";
import { LabStateToastStack } from "@/features/contests/components/lab-state-toast";
import { gradeFailToastDetail } from "@/features/contests/grade-toast-copy";
import { useDeadlineCountdown } from "@/features/contests/contest-clock";
import { useContestCaptureModal } from "@/features/contests/hooks/use-contest-capture-modal";
import { useContestExerciseLoader } from "@/features/contests/hooks/use-contest-exercise-loader";
import { useContestOperatorStats } from "@/features/contests/hooks/use-contest-operator-stats";
import { useLabStateToasts } from "@/features/contests/hooks/use-lab-state-toasts";
import { BriefPanel, type BriefTab } from "@/features/workspace/components/brief-panel";
import { RunPanel } from "@/features/workspace/components/run-panel";
import { SubmissionSurface } from "@/features/workspace/components/submission-surface";
import { WorkspaceGuardrailsFigmaShell } from "@/features/workspace/components/workspace-guardrails-figma-shell";
import { WorkspaceRagFigmaShell } from "@/features/workspace/components/workspace-rag-figma-shell";
import { WorkspaceSplit } from "@/features/workspace/components/workspace-split";
import {
  ragEditorTitle,
  ragShowsSimulationLab,
  useRagFigmaWorkspace,
} from "@/features/workspace/components/workspace-rag-utils";
import { useGuardrailsFigmaWorkspace } from "@/features/workspace/guardrails-workspace-data";
import {
  waitForGrade,
  waitForRun,
  workspaceApi,
} from "@/features/workspace/workspace-api";
import { WORKER_OFFLINE_MESSAGE } from "@/features/workspace/worker-offline-message";
import { ApiError } from "@/lib/api-client";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestExercise } from "@/types/contest";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import "@/features/workspace/workspace.css";
import "@/features/contests/flag-captured.css";
import "@/features/contests/lab-state-toast.css";

type ContestWorkspaceShellProps = {
  contestSlug: string;
  exerciseSlug: string;
  variant?: SittingVariant;
  workspaceMode?: "live" | "virtual";
};

function toExercise(contestExercise: ContestExercise): Exercise {
  return {
    slug: contestExercise.slug,
    version: contestExercise.version,
    title: contestExercise.title,
    briefMd: contestExercise.briefMd,
    difficulty: contestExercise.difficulty as Exercise["difficulty"],
    simulator: contestExercise.simulator as Exercise["simulator"],
    submissionSchema: contestExercise.submissionSchema,
    publicSample: contestExercise.publicSample,
    skillTags: [],
  };
}

function ContestSittingHeader({
  exercise,
  isVirtual,
}: {
  exercise: ContestExercise;
  isVirtual: boolean;
}) {
  return (
    <>
      {isVirtual ? (
        <p className="lp-ctd-ws-virtual-banner">
          Virtual practice — grades do not affect contest standings.
        </p>
      ) : null}
      {exercise.clock || exercise.scoring ? (
        <div className="lp-ctd-ws-head">
          {exercise.clock ? <ContestWorkspaceClock clock={exercise.clock} /> : null}
          {exercise.scoring ? (
            <p className="lp-ctd-ws-score" aria-live="polite">
              {exercise.scoring.entryTotalScore != null ? (
                <>
                  Score{" "}
                  <strong>
                    {exercise.scoring.entryTotalScore} / {exercise.scoring.maxScore}
                  </strong>
                </>
              ) : (
                <>
                  Max sitting score <strong>{exercise.scoring.maxScore}</strong>
                </>
              )}
              <span className="lp-ctd-ws-score-note">
                · {exercise.scoring.pointsPerProblem} pts per problem
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function ContestWorkspaceShell({
  contestSlug,
  exerciseSlug,
  variant = "contest",
  workspaceMode = "live",
}: ContestWorkspaceShellProps) {
  const { api, detailHref, labels } = sittingConfig(variant);
  const isVirtual = workspaceMode === "virtual" && variant === "contest";
  const showContestChrome = variant === "contest" && !isVirtual;
  const contestBackHref = showContestChrome
    ? routes.contestPlay(contestSlug)
    : detailHref(contestSlug);

  const {
    exercise,
    loadError,
    loadMessage,
    loadStatus,
  } = useContestExerciseLoader({
    contestSlug,
    exerciseSlug,
    isVirtual,
    api,
  });

  const {
    contestDetail,
    setContestDetail,
    operatorRank,
    setOperatorRank,
    refreshOperatorStats,
  } = useContestOperatorStats(contestSlug, showContestChrome);

  const [run, setRun] = useState<Run | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quotaHref, setQuotaHref] = useState<string | null>(null);
  const [briefTab, setBriefTab] = useState<BriefTab>("description");
  const [briefCollapsed, setBriefCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const [labPayload, setLabPayload] = useState<Record<string, unknown>>({});
  const abortRef = useRef<AbortController | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const firstBloodCandidateRef = useRef(false);

  const personalDeadlineAt =
    exercise?.clock?.personalDeadlineAt ?? contestDetail?.personalDeadlineAt ?? null;
  const personalRemaining = useDeadlineCountdown(
    showContestChrome ? personalDeadlineAt : null,
  );

  const { labToasts, pushLabToast, dismissLabToast } = useLabStateToasts({
    showContestChrome,
    pending,
    attemptCount,
    personalDeadlineAt,
    personalRemaining,
    contestSlug,
    exercise,
    contestDetail,
  });

  const {
    captureModal,
    setCaptureModal,
    openCaptureModal,
    rankBeforeSubmitRef,
  } = useContestCaptureModal({
    contestSlug,
    exerciseSlug,
    operatorRank,
    setOperatorRank,
    setContestDetail,
    pushLabToast,
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const panelExercise = exercise ? toExercise(exercise) : null;
  const ragFigma = useRagFigmaWorkspace(panelExercise, false);
  const guardrailsFigma = useGuardrailsFigmaWorkspace(panelExercise, false);

  async function onSubmit(payload: Record<string, unknown>) {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    if (showContestChrome) {
      rankBeforeSubmitRef.current = operatorRank;
    }
    setAttemptCount((n) => n + 1);
    const problemBefore = contestDetail?.problems.find((p) => p.slug === exerciseSlug);
    const solvedBefore =
      contestDetail?.problems.filter((p) => p.scored).length ?? 0;
    firstBloodCandidateRef.current = Boolean(
      problemBefore && !problemBefore.scored && solvedBefore === 0,
    );
    setPending(true);
    setSubmitError(null);
    setQuotaHref(null);
    setGrade(null);
    setRun(null);
    if (resultsCollapsed) {
      setResultsCollapsed(false);
    }
    try {
      const attempt = isVirtual
        ? await contestsApi.startVirtualAttempt(contestSlug, exerciseSlug)
        : await api.startAttempt(contestSlug, exerciseSlug);
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
        if (showContestChrome && result.verdict === "pass" && exercise) {
          openCaptureModal(
            result,
            queued.runId,
            exercise,
            firstBloodCandidateRef.current,
          );
        } else if (showContestChrome && result.verdict !== "pass") {
          pushLabToast({
            kind: "no-flag",
            title: "No flag — grader failed",
            detail: gradeFailToastDetail(result),
            points: "0",
          });
          void refreshOperatorStats();
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

  if (loadError) {
    return (
      <ContestState
        contestSlug={contestSlug}
        backHref={contestBackHref}
        backLabel={labels.eyebrow}
        {...contestProblemState(loadStatus, loadMessage, variant)}
      />
    );
  }

  if (!exercise || !panelExercise) {
    return <GlobalLoader fullPage label="Opening contest problem…" />;
  }

  const problemOnDetail = contestDetail?.problems.find((p) => p.slug === exerciseSlug);
  const problemPoints =
    problemOnDetail?.score ??
    exercise.scoring?.pointsPerProblem ??
    contestDetail?.pointsPerProblem ??
    0;
  const flagsSolved = contestDetail?.problems.filter((p) => p.scored).length ?? 0;
  const flagsTotal =
    contestDetail?.sampledCount ?? contestDetail?.problems.length ?? 15;

  const contestHeader = showContestChrome ? (
    <ContestProblemHud
      exercise={exercise}
      contestSlug={contestSlug}
      rank={operatorRank}
      totalPoints={
        contestDetail?.totalScore ?? exercise.scoring?.entryTotalScore ?? null
      }
      flagsSolved={flagsSolved}
      flagsTotal={flagsTotal}
      problemPoints={problemPoints}
      entryStatus={exercise.clock?.entryStatus ?? contestDetail?.status ?? null}
      personalDeadlineAt={personalDeadlineAt}
    />
  ) : (
    <ContestSittingHeader exercise={exercise} isVirtual={isVirtual} />
  );

  const labToastsUi = showContestChrome ? (
    <LabStateToastStack items={labToasts} onDismiss={dismissLabToast} />
  ) : null;

  const flagModal = (
    <FlagCapturedModal
      open={captureModal != null}
      payload={captureModal}
      onClose={() => setCaptureModal(null)}
    />
  );

  if (guardrailsFigma) {
    return (
      <>
        {contestHeader}
        {labToastsUi}
        {flagModal}
        <WorkspacePracticeFrame>
          <WorkspaceGuardrailsFigmaShell
            slug={panelExercise.slug}
            exercise={panelExercise}
            backHref={contestBackHref}
            run={run}
            grade={grade}
            pending={pending}
            submitError={submitError}
            onSubmit={onSubmit}
            onValidityChange={() => {}}
            briefCollapsed={briefCollapsed}
            onToggleBriefCollapsed={() => setBriefCollapsed((c) => !c)}
            resultsCollapsed={resultsCollapsed}
            onToggleResultsCollapsed={() => setResultsCollapsed((c) => !c)}
          />
        </WorkspacePracticeFrame>
      </>
    );
  }

  if (ragFigma) {
    return (
      <>
        {contestHeader}
        {labToastsUi}
        {flagModal}
        <WorkspacePracticeFrame>
          <WorkspaceRagFigmaShell
            slug={panelExercise.slug}
            exercise={panelExercise}
            backHref={contestBackHref}
            run={run}
            grade={grade}
            pending={pending}
            submitError={submitError}
            onSubmit={onSubmit}
            onValidityChange={() => {}}
            onValuesChange={setLabPayload}
            labPayload={labPayload}
            briefCollapsed={briefCollapsed}
            onToggleBriefCollapsed={() => setBriefCollapsed((c) => !c)}
            resultsCollapsed={resultsCollapsed}
            onToggleResultsCollapsed={() => setResultsCollapsed((c) => !c)}
            showSimulationLab={ragShowsSimulationLab(panelExercise.submissionSchema)}
          />
        </WorkspacePracticeFrame>
      </>
    );
  }

  const editorTitle =
    panelExercise.simulator === "rag"
      ? ragEditorTitle(panelExercise.submissionSchema)
      : "Submission";

  return (
    <>
      {contestHeader}
      {labToastsUi}
      {flagModal}
      <WorkspacePracticeFrame>
        <div className={`lp-ws lp-ws--${panelExercise.simulator}`}>
          <WorkspaceSplit
            storageKey="lp-ct-ws-brief-ratio"
            defaultRatio={0.44}
            minPrimary={300}
            minSecondary={380}
            primaryCollapsed={briefCollapsed}
            primary={
              <BriefPanel
                exercise={panelExercise}
                backHref={contestBackHref}
                backLabel={labels.eyebrow}
                hintsDisabled={exercise.hintsDisabled}
                collapsed={briefCollapsed}
                tab={briefTab}
                onTabChange={setBriefTab}
                onToggleCollapse={() => setBriefCollapsed((c) => !c)}
              />
            }
            secondary={
              <WorkspaceSplit
                direction="vertical"
                storageKey="lp-ct-ws-editor-ratio"
                defaultRatio={0.68}
                minPrimary={200}
                minSecondary={140}
                className="lp-ws-split--stack"
                secondaryCollapsed={resultsCollapsed}
                primary={
                  <div className="lp-ws-pane lp-ws-pane--work">
                    <SubmissionSurface
                      schema={panelExercise.submissionSchema}
                      simulator={panelExercise.simulator}
                      disabled={pending}
                      pending={pending}
                      error={submitError}
                      errorHref={quotaHref}
                      errorLinkLabel="Usage"
                      title={editorTitle}
                      onSubmit={onSubmit}
                    />
                  </div>
                }
                secondary={
                  <RunPanel
                    run={run}
                    grade={grade}
                    simulator={panelExercise.simulator}
                    collapsed={resultsCollapsed}
                    onToggleCollapse={() => setResultsCollapsed((c) => !c)}
                  />
                }
              />
            }
          />
        </div>
      </WorkspacePracticeFrame>
    </>
  );
}
