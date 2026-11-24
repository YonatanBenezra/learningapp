"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExerciseTools } from "@/types/tools";
import { toolLocksFrom, type ToolLocks } from "./tool-locks";
import { toolsApi } from "./tools-api";

/**
 * The tool ladder for one exercise outside the practice workspace (virtual
 * contest practice): which tools are locked, with early unlock and refresh.
 * Returns null when `enabled` is false, so every tool stays open.
 */
export function useExerciseToolLocks(slug: string, enabled: boolean): ToolLocks | null {
  const [tools, setTools] = useState<{ slug: string; data: ExerciseTools } | null>(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const unlock = useCallback(async (toolId: string) => {
    await toolsApi.unlock(toolId);
    setVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    toolsApi
      .forExercise(slug)
      .then((data) => {
        if (!cancelled) {
          setTools({ slug, data });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug, enabled, version]);

  return useMemo(
    () =>
      enabled
        ? toolLocksFrom(tools?.slug === slug ? tools.data : null, unlock, refresh)
        : null,
    [enabled, tools, slug, unlock, refresh],
  );
}
