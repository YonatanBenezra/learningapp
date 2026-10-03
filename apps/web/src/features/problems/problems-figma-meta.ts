import {
  GUARDRAILS_G1_SLUG,
  GUARDRAILS_G2_SLUG,
  GUARDRAILS_G3_SLUG,
} from "@/features/simulations/simulations-demo-data";

export type ProblemMode = "red" | "blue";

export type ProblemRowStatus = "in_progress" | "not_started" | "cleared";

export type ProblemFigmaMeta = {
  code: string;
  subtitle: string;
  tags: string[];
  mode: ProblemMode;
  modeLabel: string;
  solveRate: number;
  status: ProblemRowStatus;
  continueLevel?: { current: number; total: number };
};

const GUARDRAILS_META: Record<string, ProblemFigmaMeta> = {
  [GUARDRAILS_G1_SLUG]: {
    code: "G1",
    subtitle: "Gandalf-style levels - chat with a hotel concierge",
    tags: ["prompt-injection", "3 levels"],
    mode: "red",
    modeLabel: "Red team",
    solveRate: 61,
    status: "in_progress",
    continueLevel: { current: 2, total: 3 },
  },
  [GUARDRAILS_G2_SLUG]: {
    code: "G2",
    subtitle: "Plant instructions in a page the agent reads",
    tags: ["indirect-injection", "tool-abuse"],
    mode: "red",
    modeLabel: "Red team",
    solveRate: 28,
    status: "not_started",
  },
  [GUARDRAILS_G3_SLUG]: {
    code: "G3",
    subtitle: "Write a defense stack against 40 hidden attacks",
    tags: ["guardrails", "filters"],
    mode: "blue",
    modeLabel: "Blue team",
    solveRate: 12,
    status: "not_started",
  },
};

export function figmaMetaForSlug(slug: string): ProblemFigmaMeta | null {
  return GUARDRAILS_META[slug] ?? null;
}

export const GUARDRAILS_TRACK_LEVELS = [
  { id: "g1-l1", label: "G1 · L1 · Front desk", state: "cleared" as const },
  { id: "g1-l2", label: "G1 · L2 · Instruction-hardened", state: "in_progress" as const },
  { id: "g1-l3", label: "G1 · L3 · Output-filtered", state: "locked" as const },
  { id: "g2", label: "G2 · The Indirect Payload", state: "not_started" as const },
  { id: "g3", label: "G3 · Hold the Line", state: "not_started" as const },
];

export const GUARDRAILS_TRACK_CLEARED = 1;
export const GUARDRAILS_TRACK_TOTAL = 5;

export const GUARDRAILS_CONTEST = {
  title: "Guardrails CTF · October",
  copy: "Same three exercises, timed, with a live leaderboard. Contest mode starts Oct 12, 18:00 UTC+6.",
  startsInLabel: "starts in 14 days",
};
