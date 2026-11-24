import type { AttemptBudget } from "@/types/attempt";

export function isRagSandboxSchema(schema: unknown) {
  if (!schema || typeof schema !== "object") {
    return false;
  }
  const properties = (schema as { properties?: Record<string, unknown> }).properties;
  if (!properties) {
    return false;
  }
  const keys = Object.keys(properties);
  return keys.length === 1 && keys[0] === "source";
}

export function useRagFigmaWorkspace(
  exercise: { simulator?: string; submissionSchema?: unknown } | null,
  onboarding: boolean,
) {
  return exercise?.simulator === "rag" && !onboarding;
}

export function ragShowsSimulationLab(schema: unknown) {
  return !isRagSandboxSchema(schema);
}

export function ragEditorTitle(schema: unknown) {
  const keys = Object.keys(
    ((schema as { properties?: Record<string, unknown> })?.properties ?? {}) as Record<
      string,
      unknown
    >,
  );
  if (keys.includes("flag")) {
    return "Captured flag";
  }
  if (keys.includes("faqTopK")) {
    return "Routing profiles";
  }
  if (keys.includes("generationPrompt")) {
    return "Generation prompt";
  }
  if (keys.includes("reranker")) {
    return "Reranker config";
  }
  if (keys.includes("topK")) {
    return "Retriever budget";
  }
  return "Chunking config";
}

/**
 * "N of M submissions left · resets HH:MM" for the submit footer, or null when
 * the exercise has no limit (or the budget could not be loaded).
 */
export function attemptBudgetLabel(
  budget: AttemptBudget | null,
  now = new Date(),
): { label: string; exhausted: boolean } | null {
  if (!budget || budget.max == null || budget.remaining == null) {
    return null;
  }
  const left = `${budget.remaining} of ${budget.max} submissions left`;
  const exhausted = budget.remaining <= 0;
  const resets = budget.resetsAt ? new Date(budget.resetsAt) : null;
  if (!resets || Number.isNaN(resets.getTime())) {
    return { label: left, exhausted };
  }
  const time = resets.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const when =
    resets.toDateString() === now.toDateString()
      ? time
      : `${resets.toLocaleDateString([], { weekday: "short" })} ${time}`;
  return { label: `${left} · resets ${when}`, exhausted };
}
