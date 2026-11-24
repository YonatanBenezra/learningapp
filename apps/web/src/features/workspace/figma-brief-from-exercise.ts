import type { HintList } from "@/types/hint";
import type { Exercise, PublicSampleItem } from "@/types/exercise";
import type { FigmaBriefContent, FigmaBriefSubmission } from "./components/brief-panel";
import { briefAfterGoal, buildExerciseGuide } from "./exercise-brief-sections";
import { formatGateThreshold, gateMetricLabel, gradedGates } from "./gates";

function schemaFieldKeys(schema: unknown): string[] {
  const properties = (schema as { properties?: Record<string, unknown> })?.properties;
  if (!properties) {
    return [];
  }
  return Object.keys(properties);
}

function publicRowsFromSample(sample: unknown): FigmaBriefContent["publicRows"] {
  if (!Array.isArray(sample)) {
    return [];
  }
  return sample.slice(0, 5).map((item, index) => {
    const row = item as PublicSampleItem;
    const id = row.id ?? `p${index + 1}`;
    return {
      question: row.question ?? "",
      file: id,
      tag: "",
    };
  });
}

/** Real hint state only: unlocked text from the API, then one locked row per remaining hint. */
function hintsFromList(hints: HintList | null): FigmaBriefContent["hints"] {
  if (!hints) {
    return [];
  }
  const costOf = (index: number) => hints.costs?.[index];
  const unlocked = hints.unlocked.map((hint, index) => ({
    n: index + 1,
    unlocked: true as const,
    text: hint.text,
    cost: costOf(index),
  }));
  const locked = Array.from({ length: Math.max(0, hints.remaining) }, (_, index) => ({
    n: unlocked.length + index + 1,
    unlocked: false as const,
    cost: costOf(unlocked.length + index),
  }));
  return [...unlocked, ...locked];
}

function constraintFromGates(exercise: Exercise) {
  const gates = gradedGates(exercise.gates).map((gate) => ({
    metric: gateMetricLabel(gate.metric),
    threshold: formatGateThreshold(gate),
  }));
  return gates;
}

export function buildFigmaBriefFromExercise(
  exercise: Exercise,
  options?: {
    submissionCount?: number;
    submissions?: ReadonlyArray<FigmaBriefSubmission>;
    submissionsTruncated?: boolean;
    hints?: HintList | null;
    onUnlockHint?: () => Promise<void>;
    thresholdFootnote?: string;
  },
): FigmaBriefContent {
  const guide = buildExerciseGuide(exercise);
  const fields = schemaFieldKeys(exercise.submissionSchema);
  const shortId = exercise.slug.replace(/^rag-(\d+).*/, "rag-$1");
  const submissionCount = options?.submissionCount ?? 0;
  const gates = constraintFromGates(exercise);
  const primary = gates[0];

  return {
    submissionCount,
    submissions: options?.submissions,
    submissionsTruncated: options?.submissionsTruncated,
    meta: {
      id: shortId,
      solved: submissionCount > 0 ? `${submissionCount} submitted` : "Not submitted",
    },
    goal: guide.goal,
    fullBriefMd: briefAfterGoal(exercise.briefMd ?? ""),
    constraint: {
      metric: primary?.metric ?? "Pass criteria",
      threshold: primary?.threshold ?? "",
      footnote: primary
        ? (options?.thresholdFootnote ?? "on the hidden set")
        : "Listed in the scorecard after the first grade.",
      fields: fields.length > 0 ? fields.join(" · ") : "see submission form",
      gates: gates.length > 1 ? gates : undefined,
    },
    publicSampleNote: "Public sample — not used for grading",
    publicRows: publicRowsFromSample(exercise.publicSample),
    hints: hintsFromList(options?.hints ?? null),
    hintPointsSpent: options?.hints?.spent ?? 0,
    onUnlockHint:
      options?.hints && options.hints.remaining > 0 ? options.onUnlockHint : undefined,
  };
}

export function defaultsFromSubmissionSchema(
  schema: unknown,
  seed?: Record<string, unknown>,
): Record<string, unknown> {
  const properties =
    (schema as { properties?: Record<string, { default?: unknown }> })?.properties ??
    {};
  const out: Record<string, unknown> = { ...seed };
  for (const [key, spec] of Object.entries(properties)) {
    if (out[key] !== undefined) {
      continue;
    }
    if (spec && spec.default !== undefined) {
      out[key] = spec.default;
    }
  }
  return out;
}
