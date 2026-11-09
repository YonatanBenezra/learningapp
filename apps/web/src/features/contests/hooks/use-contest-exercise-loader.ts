"use client";

import { useEffect, useState } from "react";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestExercise } from "@/types/contest";
import { ApiError } from "@/lib/api-client";

type SittingApi = {
  getExercise: (contestSlug: string, exerciseSlug: string) => Promise<ContestExercise>;
};

export function useContestExerciseLoader({
  contestSlug,
  exerciseSlug,
  isVirtual,
  api,
}: {
  contestSlug: string;
  exerciseSlug: string;
  isVirtual: boolean;
  api: SittingApi;
}) {
  const [exercise, setExercise] = useState<ContestExercise | null>(null);
  const [loadError, setLoadError] = useState<"auth" | "load" | null>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadExercise = isVirtual
      ? contestsApi.getVirtualExercise(contestSlug, exerciseSlug)
      : api.getExercise(contestSlug, exerciseSlug);
    void loadExercise
      .then((result) => {
        if (!cancelled) {
          setExercise(result);
          setLoadError(null);
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

  return { exercise, setExercise, loadError, loadMessage, loadStatus };
}
