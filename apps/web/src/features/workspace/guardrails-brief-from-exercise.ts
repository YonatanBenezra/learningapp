import type { Exercise } from "@/types/exercise";
import type { HintList } from "@/types/hint";
import type { FigmaBriefContent } from "./components/brief-panel";
import {
  guardrailsBriefThreshold,
  guardrailsGradePathFootnote,
  guardrailsObjective,
  guardrailsSubmitFieldLabel,
  guardrailsVariantForExercise,
} from "./guardrails-workspace-data";

/**
 * Hints come only from the hints API: unlocked ones in full, locked ones with
 * the points they cost once the problem is solved. No hint is made up here.
 */
function hintsFromList(hints: HintList | null): FigmaBriefContent["hints"] {
  if (!hints) {
    return [];
  }
  const costOf = (index: number) => hints.costs?.[index];
  const unlocked = hints.unlocked.map((row, index) => ({
    n: index + 1,
    unlocked: true as const,
    text: row.text,
    cost: costOf(index),
  }));
  const locked = Array.from({ length: Math.max(0, hints.remaining) }, (_, index) => ({
    n: unlocked.length + index + 1,
    unlocked: false as const,
    cost: costOf(unlocked.length + index),
  }));
  return [...unlocked, ...locked];
}

export function buildGuardrailsFigmaBrief(
  exercise: Exercise,
  options: { hints?: HintList | null; submissionCount?: number },
): FigmaBriefContent {
  const submissionCount = options.submissionCount ?? 0;
  const variant = guardrailsVariantForExercise(exercise);
  return {
    submissionCount,
    meta: {
      id: exercise.slug.split("-")[0]?.toUpperCase() ?? "GRD",
      duration: `~${(exercise.budget as { wallClockS?: number } | undefined)?.wallClockS ?? 60}s`,
      solved: submissionCount > 0 ? `${submissionCount} submitted` : "Not submitted",
    },
    goal: guardrailsObjective(exercise),
    constraint: {
      metric: "Graded",
      threshold: variant ? guardrailsBriefThreshold(variant) : "Hidden eval",
      footnote: variant
        ? guardrailsGradePathFootnote(variant)
        : "Graded on the hidden set",
      fields: variant ? guardrailsSubmitFieldLabel(variant) : "submission payload",
    },
    publicSampleNote: "",
    publicRows: [],
    hints: hintsFromList(options.hints ?? null),
    hintPointsSpent: options.hints?.spent ?? 0,
  };
}
