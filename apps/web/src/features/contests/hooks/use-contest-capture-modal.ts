"use client";

import { useCallback, useRef, useState } from "react";
import { flagTokenForExercise } from "@/features/contests/flag-token";
import { operationElapsedMs } from "@/features/contests/contest-elapsed";
import {
  type FlagCapturedPayload,
} from "@/features/contests/components/flag-captured-modal";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestDetail, ContestExercise } from "@/types/contest";
import type { Grade } from "@/types/grade";
import type { LabStateToastItem } from "@/features/contests/components/lab-state-toast";

export function useContestCaptureModal({
  contestSlug,
  exerciseSlug,
  operatorRank,
  setOperatorRank,
  setContestDetail,
  pushLabToast,
}: {
  contestSlug: string;
  exerciseSlug: string;
  operatorRank: number | null;
  setOperatorRank: (rank: number | null) => void;
  setContestDetail: (detail: ContestDetail) => void;
  pushLabToast: (item: Omit<LabStateToastItem, "id"> & { id?: string }) => void;
}) {
  const [captureModal, setCaptureModal] = useState<FlagCapturedPayload | null>(null);
  const lastPassRunRef = useRef<string | null>(null);
  const rankBeforeSubmitRef = useRef<number | null>(null);

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
        let pointsEarned = ex.scoring?.pointsPerProblem ?? 0;
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
    [
      contestSlug,
      exerciseSlug,
      operatorRank,
      pushLabToast,
      setContestDetail,
      setOperatorRank,
    ],
  );

  return {
    captureModal,
    setCaptureModal,
    openCaptureModal,
    rankBeforeSubmitRef,
  };
}
