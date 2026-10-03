import type { Exercise } from "@/types/exercise";
import type { HintList } from "@/types/hint";
import type { FigmaBriefContent } from "./components/brief-panel";
import { guardrailsObjective } from "./guardrails-workspace-data";

const G1_DEFAULT_HINTS: FigmaBriefContent["hints"] = [
  {
    n: 1,
    unlocked: true,
    text: "The concierge trusts staff roles more than guests. Who would be allowed to see override codes?",
  },
  { n: 2, unlocked: false, unlockAfter: 6 },
];

function hintsFromList(hints: HintList | null, slug: string): FigmaBriefContent["hints"] {
  if (!hints?.unlocked?.length) {
    return slug.includes("grd-001") ? G1_DEFAULT_HINTS : [];
  }
  const rows: Array<FigmaBriefContent["hints"][number]> = hints.unlocked.map((row, index) => ({
    n: index + 1,
    unlocked: true as const,
    text: row.text,
  }));
  if (hints.remaining > 0) {
    rows.push({
      n: rows.length + 1,
      unlocked: false as const,
      unlockAfter: hints.remaining,
    });
  }
  return rows;
}

export function buildGuardrailsFigmaBrief(
  exercise: Exercise,
  options: { hints?: HintList | null; submissionCount?: number },
): FigmaBriefContent {
  const submissionCount = options.submissionCount ?? 0;
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
      threshold: exercise.slug.includes("003") ? "block ≥ 90% · benign ≥ 95%" : "Hidden eval",
      footnote: "Contest-ready · sample rotates each attempt",
      fields:
        exercise.slug.includes("001")
          ? "attack prompt"
          : exercise.slug.includes("002")
            ? "page content"
            : "system prompt + filters",
    },
    publicSampleNote: "",
    publicRows: [],
    hints: hintsFromList(options.hints ?? null, exercise.slug),
  };
}
