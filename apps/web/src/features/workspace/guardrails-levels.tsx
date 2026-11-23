"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { G1_LEVELS, G2_LEVELS } from "./guardrails-workspace-data";
import { simulationsApi } from "./simulations-api";

/** One level of a G1 or G2 exercise and what defends it. */
export type LevelCard = { level: number; title: string; defense: string };

const fallback = (variant: "g1" | "g2"): LevelCard[] =>
  (variant === "g2" ? G2_LEVELS : G1_LEVELS).map((row) => ({ ...row }));

/**
 * Every G1 and G2 exercise has its own levels, defined by the grader. They
 * are fetched once per exercise; the generic cards show until they arrive.
 */
export function useExerciseLevels(
  slug: string,
  variant: "g1" | "g2" | "g3",
): LevelCard[] {
  const kind = variant === "g2" ? "g2" : "g1";
  const [levels, setLevels] = useState<{
    slug: string;
    rows: LevelCard[];
  } | null>(null);
  useEffect(() => {
    if (variant === "g3") {
      return;
    }
    let cancelled = false;
    simulationsApi
      .levels(slug)
      .then((rows) => {
        if (!cancelled && rows.length > 0) {
          setLevels({ slug, rows });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug, variant]);
  return levels?.slug === slug ? levels.rows : fallback(kind);
}

const LevelsContext = createContext<LevelCard[] | null>(null);

export function GuardrailsLevelsProvider({
  levels,
  children,
}: {
  levels: LevelCard[];
  children: ReactNode;
}) {
  return (
    <LevelsContext.Provider value={levels}>{children}</LevelsContext.Provider>
  );
}

/** The current exercise's levels inside the guardrails workspace. */
export function useGuardrailsLevels(variant: "g1" | "g2"): LevelCard[] {
  return useContext(LevelsContext) ?? fallback(variant);
}
