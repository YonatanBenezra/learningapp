import {
  LIVE_RAG_PROBLEMS,
  LIVE_RAG_SLUGS,
} from "@/config/live-rag-problems";
import {
  GUARDRAILS_G1_SLUG,
  GUARDRAILS_G2_SLUG,
  GUARDRAILS_G3_SLUG,
  GUARDRAILS_G4_SLUG,
  GUARDRAILS_G5_SLUG,
  GUARDRAILS_G6_SLUG,
  GUARDRAILS_G7_SLUG,
  GUARDRAILS_G8_SLUG,
  GUARDRAILS_G9_SLUG,
  GUARDRAILS_G10_SLUG,
  GUARDRAILS_G11_SLUG,
} from "@/features/simulations/simulations-demo-data";

export type ProblemMode = "red" | "blue";

export type ProblemRowStatus = "in_progress" | "not_started" | "cleared";

export type ProblemFigmaMeta = {
  code: string;
  subtitle: string;
  tags: string[];
  mode: ProblemMode;
  modeLabel: string;
  /** Your pass rate on this exercise (0–100) — only when signed in and graded. */
  solveRate?: number;
  status: ProblemRowStatus;
  continueLevel?: { current: number; total: number };
};

const GUARDRAILS_META: Record<string, ProblemFigmaMeta> = {
  [GUARDRAILS_G1_SLUG]: {
    code: "G1",
    subtitle: "Direct injection against a production-style concierge stack",
    tags: ["prompt-injection", "3 levels"],
    mode: "red",
    modeLabel: "Red team",
    status: "not_started",
  },
  [GUARDRAILS_G2_SLUG]: {
    code: "G2",
    subtitle: "Refusal boundaries without breaking benign concierge flows",
    tags: ["refusal", "benign-ux"],
    mode: "blue",
    modeLabel: "Blue team",
    status: "not_started",
  },
  [GUARDRAILS_G3_SLUG]: {
    code: "G3",
    subtitle: "Tool abuse through pages the agent retrieves",
    tags: ["indirect-injection", "tool-abuse"],
    mode: "red",
    modeLabel: "Red team",
    status: "not_started",
  },
  [GUARDRAILS_G4_SLUG]: {
    code: "G4",
    subtitle: "Hex/base64/rot13 payloads vs output filters",
    tags: ["obfuscation", "encoding"],
    mode: "red",
    modeLabel: "Red team",
    status: "not_started",
  },
  [GUARDRAILS_G5_SLUG]: {
    code: "G5",
    subtitle: "BCC and tool args past policy checker",
    tags: ["tool-abuse", "email"],
    mode: "red",
    modeLabel: "Red team",
    status: "not_started",
  },
  [GUARDRAILS_G6_SLUG]: {
    code: "G6",
    subtitle: "Canary/override leaks in encoded output",
    tags: ["pii", "canary"],
    mode: "red",
    modeLabel: "Red team",
    status: "not_started",
  },
  [GUARDRAILS_G7_SLUG]: {
    code: "G7",
    subtitle: "Wilson intervals on block vs benign pass",
    tags: ["wilson", "fp-fn"],
    mode: "blue",
    modeLabel: "Blue team",
    status: "not_started",
  },
  [GUARDRAILS_G8_SLUG]: {
    code: "G8",
    subtitle: "Layered filters + prompt under Wilson gates",
    tags: ["filter-stack", "defense"],
    mode: "blue",
    modeLabel: "Blue team",
    status: "not_started",
  },
  [GUARDRAILS_G9_SLUG]: {
    code: "G9",
    subtitle: "Slow multi-turn persuasion vs concierge",
    tags: ["multi-turn", "jailbreak"],
    mode: "red",
    modeLabel: "Red team",
    status: "not_started",
  },
  [GUARDRAILS_G10_SLUG]: {
    code: "G10",
    subtitle: "Malicious instructions inside crawled pages",
    tags: ["supply-chain", "indirect"],
    mode: "red",
    modeLabel: "Red team",
    status: "not_started",
  },
  [GUARDRAILS_G11_SLUG]: {
    code: "G11",
    subtitle: "SOC-style controls with ≥95% benign pass",
    tags: ["control-mapping", "fp-fn"],
    mode: "blue",
    modeLabel: "Blue team",
    status: "not_started",
  },
};

const RAG_META: Record<string, ProblemFigmaMeta> = Object.fromEntries(
  LIVE_RAG_PROBLEMS.map((problem, index) => [
    problem.slug,
    {
      code: problem.id.replace("-", "·"),
      subtitle: problem.summary,
      tags: ["rag", "graded"],
      mode: "blue" as const,
      modeLabel: "Engineering",
      status: "not_started" as const,
    },
  ]),
);

export const RAG_TRACK_TOTAL = LIVE_RAG_PROBLEMS.length;
export const RAG_TRACK_CLEARED = 0;
export const RAG_PROBLEMS_ORDER = LIVE_RAG_SLUGS;

export function figmaMetaForSlug(slug: string): ProblemFigmaMeta | null {
  return GUARDRAILS_META[slug] ?? RAG_META[slug] ?? null;
}

export function problemFigmaMetaForExercise(
  slug: string,
  options: {
    solveRate?: number;
    cleared?: boolean;
  },
): ProblemFigmaMeta | null {
  const base = figmaMetaForSlug(slug);
  if (!base) {
    return null;
  }
  return {
    ...base,
    solveRate: options.solveRate,
    status: options.cleared ? "cleared" : base.status,
  };
}

type TrackLevelState = "cleared" | "in_progress" | "locked" | "not_started";

export const GUARDRAILS_TRACK_LEVELS: Array<{
  id: string;
  label: string;
  state: TrackLevelState;
}> = [
  { id: "g1-l1", label: "G1 · L1 · Front desk", state: "not_started" },
  { id: "g1-l2", label: "G1 · L2 · Instruction-hardened", state: "not_started" },
  { id: "g1-l3", label: "G1 · L3 · Output-filtered", state: "not_started" },
  { id: "g2", label: "G2 · Safety Refusal & Benign UX", state: "not_started" },
  { id: "g3", label: "G3 · Indirect payload", state: "not_started" },
  { id: "g4", label: "G4 · Encoding bypass", state: "not_started" },
  { id: "g5", label: "G5 · Tool args", state: "not_started" },
  { id: "g6", label: "G6 · Secret canary", state: "not_started" },
  { id: "g7", label: "G7 · Wilson gate", state: "not_started" },
  { id: "g8", label: "G8 · Filter stack", state: "not_started" },
  { id: "g9", label: "G9 · Multi-turn", state: "not_started" },
  { id: "g10", label: "G10 · Page inject", state: "not_started" },
  { id: "g11", label: "G11 · Benign pass", state: "not_started" },
];

export const GUARDRAILS_TRACK_CLEARED = 0;
export const GUARDRAILS_TRACK_TOTAL = 13;
