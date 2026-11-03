"use client";

import { useEffect, useState } from "react";
import { mapExerciseToPracticeCard } from "@/features/practice-hub/map-exercise";
import type { PracticeProblemCard } from "@/features/practice-hub/types";
import { problemsApi } from "@/features/problems/problems-api";

export function usePracticeProblems() {
  const [problems, setProblems] = useState<PracticeProblemCard[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([problemsApi.list(200), problemsApi.exerciseProgress()])
      .then(([list, progress]) => {
        if (cancelled) {
          return;
        }
        const mapped = list.items.map((ex) =>
          mapExerciseToPracticeCard(ex, progress.bySlug[ex.slug]),
        );
        setProblems(mapped);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setProblems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { problems, error, loading: problems === null };
}
