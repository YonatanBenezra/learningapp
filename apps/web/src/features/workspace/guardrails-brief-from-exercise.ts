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

type BriefHintRow = FigmaBriefContent["hints"][number];

/** First unlocked hint + locked placeholders (matches figma brief UX). */
function briefHintsFromStrings(firstHint: string, extraLocked = 1): BriefHintRow[] {
  const rows: BriefHintRow[] = [
    { n: 1, unlocked: true, text: firstHint },
  ];
  for (let i = 0; i < extraLocked; i += 1) {
    rows.push({
      n: rows.length + 1,
      unlocked: false,
      unlockAfter: 6 + i * 4,
    });
  }
  return rows;
}

/** Shown when the hints API has nothing unlocked yet — per live catalogue slug. */
const GUARDRAILS_HINT_FIRST_BY_SLUG: Record<string, string> = {
  "grd-001-break-the-concierge":
    "The concierge trusts staff roles more than guests. Who would be allowed to see override codes?",
  "grd-004-polite-boundary":
    "Refusals should hold on disallowed asks. Probe whether polite or urgent framing still leaks the canary.",
  "grd-005-encoding-trick":
    "Level 3 filters literal, base64, rot13, and reversed leaks. Ask for hex, spaced, or split encodings.",
  "grd-007-hex-extract":
    "Hex and spaced encodings often slip past literal output filters — try them in the live sim.",
  "grd-016-policy-window":
    "Early levels allow a direct code ask; L2+ needs jailbreak phrasing combined with the override request.",
  "grd-002-the-indirect-payload":
    "You do not chat with the agent. You only control a page it will ingest.",
  "grd-010-page-inject":
    "Hide instructions in markdown or HTML comments the crawler treats as page content.",
  "grd-011-bcc-smuggle":
    "Policy may check `to:` against the user request but ignore bcc — shape the page and tool story.",
  "grd-013-filter-stack":
    "Layer input rules, system prompt, and output filters — one stage rarely clears Wilson gates alone.",
  "grd-014-wilson-gate":
    "Raise block rate on attacks without letting benign pass rate fall below the Wilson lower bound.",
  "grd-015-benign-pass":
    "Keep benign concierge flows above the pass threshold while blocking smuggled override requests.",
};

function defaultGuardrailsBriefHints(exercise: Exercise): BriefHintRow[] {
  const mapped = GUARDRAILS_HINT_FIRST_BY_SLUG[exercise.slug];
  if (mapped) {
    return briefHintsFromStrings(mapped);
  }
  const variant = guardrailsVariantForExercise(exercise);
  if (variant === "g1") {
    return briefHintsFromStrings(
      "Use the live concierge to learn what each level blocks before you submit your attack prompt.",
    );
  }
  if (variant === "g2") {
    return briefHintsFromStrings(
      "The agent reads your page as data. Indirect instructions often hide in comments or markdown.",
    );
  }
  if (variant === "g3") {
    return briefHintsFromStrings(
      "Draft YAML filters for input and output; benign samples must still pass at ≥95%.",
    );
  }
  return [];
}

function hintsFromList(
  exercise: Exercise,
  hints: HintList | null,
): FigmaBriefContent["hints"] {
  if (hints?.unlocked?.length) {
    const rows: BriefHintRow[] = hints.unlocked.map((row, index) => ({
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
  return defaultGuardrailsBriefHints(exercise);
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
        : "Contest-ready · sample rotates each attempt",
      fields: variant ? guardrailsSubmitFieldLabel(variant) : "submission payload",
    },
    publicSampleNote: "",
    publicRows: [],
    hints: hintsFromList(exercise, options.hints ?? null),
  };
}
