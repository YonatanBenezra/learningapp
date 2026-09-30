import type { HintList } from "@/types/hint";
import type { Exercise, PublicSampleItem } from "@/types/exercise";
import type { FigmaBriefContent } from "./components/brief-panel";
import { buildExerciseGuide } from "./exercise-brief-sections";

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
    const question = row.question ?? "Sample question";
    const short =
      question.length > 32 ? `${question.slice(0, 30)}…` : question;
    const tag = row.id?.replace(/^p/i, "sample") ?? `q${index + 1}`;
    return {
      question: short,
      file: `${tag}.md`,
      tag,
    };
  });
}

function hintsFromList(hints: HintList | null): FigmaBriefContent["hints"] {
  if (!hints?.unlocked?.length) {
    return [
      {
        n: 1,
        unlocked: true,
        text: "Submit once with defaults to see baseline metrics, then tune chunk size and overlap.",
      },
      { n: 2, unlocked: false, unlockAfter: 2 },
    ];
  }
  const rows: Array<FigmaBriefContent["hints"][number]> = hints.unlocked.map(
    (hint, index) => {
    if (index === 0) {
      return { n: hint.index, unlocked: true as const, text: hint.text };
    }
    return {
      n: hint.index,
      unlocked: false as const,
      unlockAfter: hint.index,
    };
  },
  );
  if (hints.remaining > 0) {
    rows.push({
      n: rows.length + 1,
      unlocked: false,
      unlockAfter: rows.length + hints.remaining,
    });
  }
  return rows;
}

export function buildFigmaBriefFromExercise(
  exercise: Exercise,
  options?: {
    submissionCount?: number;
    hints?: HintList | null;
    metric?: string;
    threshold?: string;
    thresholdFootnote?: string;
  },
): FigmaBriefContent {
  const guide = buildExerciseGuide(exercise);
  const fields = schemaFieldKeys(exercise.submissionSchema);
  const shortId = exercise.slug.replace(/^rag-(\d+).*/, "rag-$1");

  return {
    submissionCount: options?.submissionCount ?? 0,
    meta: {
      id: shortId,
      duration: exercise.difficulty === "E" ? "~15 min" : "~25 min",
      solved: "—",
    },
    goal: guide.goal,
    constraint: {
      metric: options?.metric ?? "recall@5",
      threshold: options?.threshold ?? "≥ 0.80",
      footnote: options?.thresholdFootnote ?? "on the hidden set",
      fields: fields.length > 0 ? fields.join(" · ") : "see submission form",
    },
    publicSampleNote: "Public sample — not used for grading",
    publicRows: publicRowsFromSample(exercise.publicSample),
    hints: hintsFromList(options?.hints ?? null),
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
