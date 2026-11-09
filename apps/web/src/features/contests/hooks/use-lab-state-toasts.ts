"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import {
  labToastId,
  type LabStateToastItem,
} from "@/features/contests/components/lab-state-toast";
import {
  formatDeadlineClock,
  formatRemainingHms,
} from "@/features/contests/grade-toast-copy";
import type { ContestDetail, ContestExercise } from "@/types/contest";

const LOW_TIME_MS = 10 * 60 * 1000;
const RUNNING_TOAST_ID = "lab-toast-running";

export function useLabStateToasts({
  showContestChrome,
  pending,
  attemptCount,
  personalDeadlineAt,
  personalRemaining,
  contestSlug,
  exercise,
  contestDetail,
}: {
  showContestChrome: boolean;
  pending: boolean;
  attemptCount: number;
  personalDeadlineAt: string | null;
  personalRemaining: number | null;
  contestSlug: string;
  exercise: ContestExercise | null;
  contestDetail: ContestDetail | null;
}) {
  const [labToasts, setLabToasts] = useState<LabStateToastItem[]>([]);
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

  return { labToasts, pushLabToast, dismissLabToast };
}
