"use client";

import { useEffect, useMemo, useState } from "react";
import { isActiveSimulator } from "@/config/simulators";
import { ensureAuthSession, getAuthSnapshot } from "@/features/auth/auth-session";
import { problemsApi } from "@/features/problems/problems-api";
import type { CatalogProblem, ProblemTrack } from "./problems-figma-catalog";
import {
  exerciseToCatalogProblem,
  sortCatalogRecommended,
} from "./problems-figma-mapper";

export type ProblemsCatalogState =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "ready"; catalog: CatalogProblem[] };

export function useProblemsCatalog(): ProblemsCatalogState {
  const [catalog, setCatalog] = useState<CatalogProblem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [list, session] = await Promise.all([
          problemsApi.list(200),
          ensureAuthSession().then(() => getAuthSnapshot()),
        ]);
        let bySlug: Record<string, import("./problems-api").UserExerciseSolveStat> =
          {};
        const signedIn =
          session.status === "authenticated" || session.status === "soft";
        if (signedIn) {
          try {
            const progress = await problemsApi.exerciseProgress();
            bySlug = progress.bySlug ?? {};
          } catch {
            bySlug = {};
          }
        }
        const items = list.items
          .filter((ex) => isActiveSimulator(ex.simulator) || ex.simulator === "agent")
          .map((ex) => exerciseToCatalogProblem(ex, bySlug[ex.slug]))
          .sort(sortCatalogRecommended);
        if (!cancelled) {
          setCatalog(items);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setCatalog(null);
        }
      }
    }

    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return useMemo(() => {
    if (error) {
      return { phase: "error" };
    }
    if (!catalog) {
      return { phase: "loading" };
    }
    return { phase: "ready", catalog };
  }, [catalog, error]);
}

export function trackCounts(catalog: CatalogProblem[]): Record<ProblemTrack | "all", number> {
  const counts: Record<ProblemTrack | "all", number> = {
    all: catalog.length,
    rag: 0,
    guard: 0,
    agent: 0,
    eval: 0,
    prompt: 0,
  };
  for (const row of catalog) {
    counts[row.track] += 1;
  }
  return counts;
}

export function progressByTrack(catalog: CatalogProblem[]) {
  const tracks: ProblemTrack[] = ["rag", "guard", "agent"];
  return tracks
    .map((track) => {
      const rows = catalog.filter((p) => p.track === track);
      if (rows.length === 0) {
        return null;
      }
      const solved = rows.filter((p) => p.status === "solved").length;
      const inProgress = rows.filter((p) => p.status === "in_progress").length;
      const label =
        track === "rag" ? "RAG" : track === "guard" ? "Guard" : "Agent";
      return { track, label, solved, inProgress, total: rows.length };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export function continueProblem(catalog: CatalogProblem[]): CatalogProblem | null {
  return (
    catalog.find((p) => p.status === "in_progress") ??
    catalog.find((p) => p.status === "not_started") ??
    null
  );
}

export function groupMetaForTrack(
  track: ProblemTrack,
  catalog: CatalogProblem[],
  visibleOnPage: number,
) {
  const rows = catalog.filter((p) => p.track === track);
  const solved = rows.filter((p) => p.status === "solved").length;
  const total = rows.length;
  const label =
    track === "rag" ? "RAG" : track === "guard" ? "Guard" : track === "agent" ? "Agent" : track;
  return {
    label,
    shownOf: `${visibleOnPage} of ${total}`,
    solvedLabel: `${solved}/${total} solved`,
    solvedFrac: total === 0 ? 0 : solved / total,
  };
}
