"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { flagTokenForExercise } from "@/features/contests/flag-token";
import { operationElapsedMs } from "@/features/contests/contest-elapsed";
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
import {
  FlagCapturedModal,
  type FlagCapturedPayload,
} from "@/features/contests/components/flag-captured-modal";
import {
  LabStateToastStack,
  labToastId,
  type LabStateToastItem,
} from "@/features/contests/components/lab-state-toast";
import {
  formatDeadlineClock,
  formatRemainingHms,
  gradeFailToastDetail,
} from "@/features/contests/grade-toast-copy";
import { useDeadlineCountdown } from "@/features/contests/contest-clock";
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
import toast from "react-hot-toast";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestDetail, ContestExercise } from "@/types/contest";
import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import "@/features/workspace/workspace.css";
import "@/features/contests/flag-captured.css";
import "@/features/contests/lab-state-toast.css";

const LOW_TIME_MS = 10 * 60 * 1000;
const RUNNING_TOAST_ID = "lab-toast-running";

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

  const [exercise, setExercise] = useState<ContestExercise | null>(null);
  const [loadError, setLoadError] = useState<"auth" | "load" | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<number | null>(null);
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
  const lastPassRunRef = useRef<string | null>(null);
  const rankBeforeSubmitRef = useRef<number | null>(null);

  const [contestDetail, setContestDetail] = useState<ContestDetail | null>(null);
  const [operatorRank, setOperatorRank] = useState<number | null>(null);
  const [captureModal, setCaptureModal] = useState<FlagCapturedPayload | null>(null);
  const [labToasts, setLabToasts] = useState<LabStateToastItem[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const firstBloodCandidateRef = useRef(false);
  const lowTimeToastShownRef = useRef(false);
  const expiredToastShownRef = useRef(false);

  const dismissLabToast = useCallback((id: string) => {
    setLabToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushLabToast = useCallback(
    (item: Omit<LabStateToastItem, "id"> & { id?: string }) => {
      const id = item.id ?? labToastId();
      const next: LabStateToastItem = { ...item, id };
      setLabToasts((prev) =>
        [next, ...prev.filter((t) => t.id !== next.id && t.kind !== next.kind)].slice(
          0,
          4,
        ),
      );
      if (
        next.kind !== "running" &&
        next.kind !== "time-low" &&
        next.kind !== "clock-expired"
      ) {
        window.setTimeout(() => {
          setLabToasts((prev) => prev.filter((t) => t.id !== id));
        }, 9000);
      }
    },
    [],
  );

  const openCaptureModal = useCallback(
    (
      result: Grade,
      runId: string,
      ex: ContestExercise,
      firstBlood: boolean,
    ) => {
      if (lastPassRunRef.current === runId) {
        return;
      }
      lastPassRunRef.current = runId;

      const recall =
        typeof result.scorecard?.recallAt5 === "number"
          ? result.scorecard.recallAt5
          : typeof result.metrics?.recall_at_5?.value === "number"
            ? result.metrics.recall_at_5.value
            : null;
      const subtitle =
        recall != null
          ? `${ex.title} · Recall@5 ${recall.toFixed(2)}`
          : ex.title;

      void (async () => {
        let pointsEarned =
          ex.scoring?.pointsPerProblem ?? 0;
        let rank: number | null = operatorRank;
        let rankDelta: number | null = null;
        let flagsSolved = 0;
        let flagsTotal = ex.scoring?.maxScore
          ? Math.round(ex.scoring.maxScore / (ex.scoring.pointsPerProblem || 1))
          : 15;
        let elapsedMs = operationElapsedMs(ex.clock?.startedAt ?? null, undefined);
        let nextExerciseSlug: string | null = null;

        try {
          const [detail, board] = await Promise.all([
            contestsApi.getBySlug(contestSlug),
            contestsApi.leaderboard(contestSlug, 1, 50),
          ]);
          setContestDetail(detail);
          const you = board.items.find((row) => row.isYou);
          rank = you?.rank ?? rank;
          const problem = detail.problems.find((p) => p.slug === exerciseSlug);
          pointsEarned =
            problem?.score ?? detail.pointsPerProblem ?? pointsEarned;
          flagsSolved = you?.solvedCount ?? detail.problems.filter((p) => p.scored).length;
          flagsTotal = you?.totalCount ?? detail.sampledCount;
          elapsedMs = operationElapsedMs(detail.startedAt, detail.elapsedMs);
          nextExerciseSlug =
            detail.problems.find((p) => !p.scored && p.slug !== exerciseSlug)?.slug ??
            null;
          const rankBefore = rankBeforeSubmitRef.current;
          if (rankBefore != null && rank != null && rankBefore > rank) {
            rankDelta = rankBefore - rank;
          }
          setOperatorRank(rank);
        } catch {
          /* fall back to exercise-local stats */
        }

        setCaptureModal({
          contestSlug,
          exerciseSlug,
          challengeTitle: subtitle,
          pointsEarned,
          flagToken: flagTokenForExercise(exerciseSlug, result),
          rank,
          rankDelta,
          flagsSolved,
          flagsTotal,
          elapsedMs,
          nextExerciseSlug,
        });

        if (firstBlood) {
          pushLabToast({
            kind: "first-blood",
            title: "FIRST BLOOD!",
            detail: `You're the first to pwn ${ex.title}`,
            points: `+${pointsEarned}`,
          });
        } else {
          pushLabToast({
            kind: "flag-captured",
            title: "Flag captured",
            detail:
              rankDelta != null && rankDelta > 0
                ? `${ex.title} · rank ▲ ${rankDelta}`
                : ex.title,
            points: `+${pointsEarned}`,
          });
        }
      })();
    },
    [contestSlug, exerciseSlug, operatorRank, pushLabToast],
  );

  const refreshOperatorStats = useCallback(async () => {
    if (!showContestChrome) {
      return;
    }
    try {
      const [detail, board] = await Promise.all([
        contestsApi.getBySlug(contestSlug),
        contestsApi.leaderboard(contestSlug, 1, 50),
      ]);
      setContestDetail(detail);
      setOperatorRank(board.items.find((row) => row.isYou)?.rank ?? null);
    } catch {
      /* keep last stats */
    }
  }, [contestSlug, showContestChrome]);

  useEffect(() => {
    void refreshOperatorStats();
  }, [refreshOperatorStats]);

  const personalDeadlineAt =
    exercise?.clock?.personalDeadlineAt ?? contestDetail?.personalDeadlineAt ?? null;
  const personalRemaining = useDeadlineCountdown(
    showContestChrome ? personalDeadlineAt : null,
  );

  useEffect(() => {
    if (!showContestChrome) {
      return;
    }
    if (pending) {
      setLabToasts((prev) => {
        const rest = prev.filter((t) => t.kind !== "running");
        const running: LabStateToastItem = {
          id: RUNNING_TOAST_ID,
          kind: "running",
          title: "Grading on hidden set…",
          detail: `Attempt ${Math.max(1, attemptCount)} · ~20s · keep working`,
          badge: "Running",
          dismissible: false,
        };
        return [running, ...rest];
      });
    } else {
      setLabToasts((prev) => prev.filter((t) => t.kind !== "running"));
    }
  }, [pending, attemptCount, showContestChrome]);

  useEffect(() => {
    if (!showContestChrome || !personalDeadlineAt || personalRemaining == null) {
      return;
    }
    if (
      personalRemaining > 0 &&
      personalRemaining <= LOW_TIME_MS &&
      !lowTimeToastShownRef.current
    ) {
      lowTimeToastShownRef.current = true;
      pushLabToast({
        kind: "time-low",
        title: "10 minutes left",
        detail: `Operation clock ends at ${formatDeadlineClock(personalDeadlineAt)}`,
        points: formatRemainingHms(personalRemaining),
      });
    }
  }, [personalDeadlineAt, personalRemaining, pushLabToast, showContestChrome]);

  useEffect(() => {
    if (!showContestChrome) {
      return;
    }
    const expired =
      exercise?.clock?.entryStatus === "expired" ||
      contestDetail?.status === "expired";
    if (!expired || expiredToastShownRef.current) {
      return;
    }
    expiredToastShownRef.current = true;
    const lockedScore =
      contestDetail?.totalScore ?? exercise?.scoring?.entryTotalScore ?? 0;
    pushLabToast({
      kind: "clock-expired",
      title: "Operation clock expired",
      detail: `Submissions closed · score locked at ${lockedScore.toLocaleString()}`,
      badge: "Results",
      actionHref: routes.contestPlay(contestSlug),
      actionLabel: "Results",
    });
  }, [
    contestDetail?.status,
    contestDetail?.totalScore,
    contestSlug,
    exercise?.clock?.entryStatus,
    exercise?.scoring?.entryTotalScore,
    pushLabToast,
    showContestChrome,
  ]);

  useEffect(() => {
    let cancelled = false;
    const loadExercise = isVirtual
      ? contestsApi.getVirtualExercise(contestSlug, exerciseSlug)
      : api.getExercise(contestSlug, exerciseSlug);
    loadExercise
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
        setLoadStatus(caught instanceof ApiError ? caught.status : null);
        setLoadMessage(caught instanceof ApiError ? caught.message : null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, contestSlug, exerciseSlug, isVirtual]);

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
