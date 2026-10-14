import { routes } from "@/config/routes";

export type ProblemTrack = "rag" | "eval" | "guard" | "prompt";
export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemMode = "engineering" | "red" | "blue";
export type ProblemStatus = "solved" | "in_progress" | "not_started";
export type ProblemAction = "review" | "start" | "continue";

export type CatalogProblem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  track: ProblemTrack;
  difficulty: ProblemDifficulty;
  mode: ProblemMode;
  solveRate: number;
  status: ProblemStatus;
  action: ProblemAction;
  current?: boolean;
  actionPrimary?: boolean;
};

export const TRACK_COUNTS: Record<ProblemTrack | "all", number> = {
  all: 30,
  rag: 14,
  eval: 6,
  guard: 6,
  prompt: 4,
};

export const FIGMA_CATALOG: CatalogProblem[] = [
  {
    id: "P1-R1",
    slug: "rag-001-chunk-it-right",
    title: "Corpus Chunk Boundaries",
    description:
      "Normalize docs and fix chunk boundaries until recall@5 clears the bar.",
    tags: ["rag", "graded"],
    track: "rag",
    difficulty: "easy",
    mode: "engineering",
    solveRate: 64,
    status: "solved",
    action: "review",
  },
  {
    id: "P1-R2",
    slug: "rag-006-overlap-tune",
    title: "Overlap & Sliding Windows",
    description: "Heading-aware overlap so gold spans are not split across chunks.",
    tags: ["rag", "graded"],
    track: "rag",
    difficulty: "easy",
    mode: "engineering",
    solveRate: 61,
    status: "solved",
    action: "review",
  },
  {
    id: "P1-R3",
    slug: "rag-003-retrieval-top-k",
    title: "Retrieval Top-K Baseline",
    description: "Set top-k and rerank on a frozen index — recall@5 baseline.",
    tags: ["rag", "graded"],
    track: "rag",
    difficulty: "easy",
    mode: "engineering",
    solveRate: 70,
    status: "not_started",
    action: "start",
  },
  {
    id: "P2-R1",
    slug: "rag-010-window-fit",
    title: "Metadata Scope & Window Fit",
    description: "Align chunk windows with policy sections; scope by metadata.",
    tags: ["rag", "graded"],
    track: "rag",
    difficulty: "easy",
    mode: "engineering",
    solveRate: 55,
    status: "not_started",
    action: "start",
  },
  {
    id: "P2-R3",
    slug: "rag-002-the-cost-ceiling",
    title: "Cost-Capped Retrieval",
    description: "Hold recall@k while mean prompt tokens stay under budget.",
    tags: ["rag", "cost"],
    track: "rag",
    difficulty: "medium",
    mode: "engineering",
    solveRate: 31,
    status: "in_progress",
    action: "continue",
    current: true,
    actionPrimary: true,
  },
  {
    id: "P3-R1",
    slug: "rag-003-the-citation-contract",
    title: "Citation-Grounded Answers",
    description:
      "Generation prompt with [chunk:id] citations and abstain on no-evidence.",
    tags: ["rag", "citations"],
    track: "rag",
    difficulty: "medium",
    mode: "engineering",
    solveRate: 27,
    status: "not_started",
    action: "start",
  },
  {
    id: "G1",
    slug: "grd-001-break-the-concierge",
    title: "Direct Injection & Prompt Exfiltration",
    description: "Direct injection against a production-style concierge bot.",
    tags: ["prompt-injection", "3 levels"],
    track: "guard",
    difficulty: "easy",
    mode: "red",
    solveRate: 58,
    status: "in_progress",
    action: "continue",
  },
  {
    id: "G2",
    slug: "grd-004-polite-boundary",
    title: "Safety Refusal & Benign UX",
    description: "Refusal boundaries without breaking benign concierge flows.",
    tags: ["refusal", "benign-ux"],
    track: "guard",
    difficulty: "easy",
    mode: "blue",
    solveRate: 49,
    status: "not_started",
    action: "start",
  },
  {
    id: "G3",
    slug: "grd-002-the-indirect-payload",
    title: "Indirect Injection via Retrieved Content",
    description: "Tool abuse through pages the agent retrieves.",
    tags: ["indirect-injection", "tool-abuse"],
    track: "guard",
    difficulty: "medium",
    mode: "red",
    solveRate: 22,
    status: "not_started",
    action: "start",
  },
  {
    id: "G4",
    slug: "grd-005-encoding-trick",
    title: "Obfuscation & Encoding Bypass",
    description: "Hex, base64 and rot13 payloads vs output filters.",
    tags: ["obfuscation", "encoding"],
    track: "guard",
    difficulty: "medium",
    mode: "red",
    solveRate: 18,
    status: "not_started",
    action: "start",
  },
  ...Array.from({ length: 20 }, (_, i) => {
    const n = i + 11;
    const tracks: ProblemTrack[] = ["rag", "rag", "eval", "eval", "guard", "prompt"];
    const track = tracks[i % tracks.length] ?? "rag";
    return {
      id: `PX-${n}`,
      slug: `placeholder-problem-${n}`,
      title: `Practice set ${n}`,
      description: "Graded exercise on the hidden eval — details in the workspace.",
      tags: [track, "graded"],
      track,
      difficulty: (n % 3 === 0 ? "hard" : n % 2 ? "medium" : "easy") as ProblemDifficulty,
      mode: "engineering" as ProblemMode,
      solveRate: 20 + (n % 50),
      status: "not_started" as ProblemStatus,
      action: "start" as ProblemAction,
    };
  }),
];

export function hrefForProblem(slug: string) {
  if (slug.startsWith("placeholder")) return routes.problems;
  return routes.exercise(slug);
}

export const CONTINUE_PROBLEM = FIGMA_CATALOG.find((p) => p.current)!;

export const PROGRESS_BY_TRACK: {
  track: ProblemTrack;
  label: string;
  solved: number;
  inProgress: number;
  total: number;
}[] = [
  { track: "rag", label: "RAG", solved: 2, inProgress: 1, total: 14 },
  { track: "eval", label: "Eval", solved: 0, inProgress: 0, total: 6 },
  { track: "guard", label: "Guard", solved: 0, inProgress: 1, total: 6 },
  { track: "prompt", label: "Prompt", solved: 0, inProgress: 0, total: 4 },
];
