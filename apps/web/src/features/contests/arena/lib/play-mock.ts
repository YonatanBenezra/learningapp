import type { ContestDetail } from "@/types/contest";
import { dynamicPoints } from "./points";
import type {
  ActivityRow,
  AroundYouRow,
  PlayBoardChallenge,
  PlayChallengeDef,
  PlayEntryHud,
} from "./play-types";

const OBJ_DEFAULT =
  "Build a larger candidate pool and rerank it to lift nDCG@5 — without breaking the strict model-call budget. Tune the reranker, top-N and the query rewrite prompt.";

const CRITERIA = {
  metric: "Recall@5 ≥ 0.80",
  threshold: "Recall@5 ≥ 0.80",
  budget: "model calls ≤ 20",
};

const RATING = [4, 11, 20, 31, 48, 56, 39, 22, 13, 6];

export const MOCK_PLAY_CHALLENGES: PlayChallengeDef[] = [
  {
    id: "grd-stack",
    problemSlug: "grd-022-adv-filter-stack",
    title: "Defense in Depth — Advanced Stack",
    categoryId: "guardrails",
    difficulty: "Insane",
    base: 500,
    solves: 6,
    firstBlood: { user: "nadia.k", afterSec: 1264 },
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "GRD-022",
  },
  {
    id: "rag-sandbox",
    problemSlug: "rag-029-adv-python-retriever",
    title: "Custom Retriever — Advanced Sandbox",
    categoryId: "retrieval",
    difficulty: "Insane",
    base: 500,
    solves: 4,
    firstBlood: { user: "nadia.k", afterSec: 980 },
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "RAG-029",
  },
  {
    id: "rag-028",
    problemSlug: "rag-028-adv-rerank-rethink",
    title: "Two-Stage Retrieve + Rerank",
    categoryId: "retrieval",
    difficulty: "Hard",
    base: 400,
    solves: 38,
    firstBlood: { user: "nadia.k", afterSec: 1264 },
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "RAG-028",
  },
  {
    id: "grd-fpfn",
    problemSlug: "grd-023-adv-wilson-gate",
    title: "FP/FN Tradeoff at Scale",
    categoryId: "guardrails",
    difficulty: "Hard",
    base: 400,
    solves: 29,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "GRD-023",
  },
  {
    id: "pi-supply",
    problemSlug: "grd-017-adv-indirect-payload",
    title: "Supply-Chain Prompts in Documents",
    categoryId: "prompt-injection",
    difficulty: "Hard",
    base: 400,
    solves: 24,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "PI-017",
  },
  {
    id: "pi-indirect",
    problemSlug: "grd-021-adv-page-inject",
    title: "Indirect Injection via Retrieval",
    categoryId: "prompt-injection",
    difficulty: "Hard",
    base: 400,
    solves: 31,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "PI-021",
  },
  {
    id: "grd-jailbreak",
    problemSlug: "grd-020-adv-bcc-smuggle",
    title: "Jailbreak Classifier Thresholds",
    categoryId: "guardrails",
    difficulty: "Hard",
    base: 400,
    solves: 19,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "GRD-020",
  },
  {
    id: "rag-multihop",
    problemSlug: "rag-027-adv-citation-contract",
    title: "Multi-hop Query Planner",
    categoryId: "retrieval",
    difficulty: "Hard",
    base: 400,
    solves: 22,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "RAG-027",
  },
  {
    id: "eval-slice",
    problemSlug: "rag-030-adv-score-gate",
    title: "Eval Slice Regression Gate (Advanced)",
    categoryId: "evals",
    difficulty: "Medium",
    base: 300,
    solves: 61,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "EVL-030",
  },
  {
    id: "grd-control",
    problemSlug: "grd-024-adv-benign-pass",
    title: "Control Mapping & Benign Pass",
    categoryId: "guardrails",
    difficulty: "Medium",
    base: 300,
    solves: 55,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "GRD-024",
  },
  {
    id: "eval-citation",
    problemSlug: "rag-026-adv-chunk-balance",
    title: "Citation Faithfulness Gate",
    categoryId: "evals",
    difficulty: "Medium",
    base: 300,
    solves: 47,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "EVL-026",
  },
  {
    id: "exfil-pii",
    problemSlug: "grd-019-adv-hex-extract",
    title: "PII Redaction Pipeline",
    categoryId: "exfiltration",
    difficulty: "Medium",
    base: 300,
    solves: 52,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "EXF-019",
  },
  {
    id: "rag-hybrid",
    problemSlug: "rag-025-adv-cost-ceiling",
    title: "Hybrid Search Weighting",
    categoryId: "retrieval",
    difficulty: "Easy",
    base: 200,
    solves: 112,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "RAG-025",
  },
  {
    id: "rag-chunk",
    problemSlug: "rag-026-adv-chunk-balance",
    title: "Chunking Under Token Caps",
    categoryId: "retrieval",
    difficulty: "Easy",
    base: 200,
    solves: 98,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "RAG-026",
  },
  {
    id: "exfil-schema",
    problemSlug: "grd-025-adv-policy-window",
    title: "Output Schema Enforcement",
    categoryId: "exfiltration",
    difficulty: "Easy",
    base: 200,
    solves: 104,
    objective: OBJ_DEFAULT,
    passCriteria: CRITERIA,
    knobs: ["reranker", "rerankTopN", "queryRewritePrompt"],
    ratingVotes: RATING,
    code: "EXF-025",
  },
];

export const MOCK_AROUND_YOU: AroundYouRow[] = [
  { rank: 39, name: "nusrat.k", score: 1140 },
  { rank: 40, name: "farhan.io", score: 1102 },
  { rank: 41, name: "de.bina", score: 1085, isYou: true },
  { rank: 42, name: "sumaiya", score: 1060 },
  { rank: 43, name: "k4rim", score: 1031 },
];

export const MOCK_ACTIVITY: ActivityRow[] = [
  {
    id: "a1",
    user: "nadia.k",
    kind: "firstBlood",
    challenge: "Defense in Depth",
    points: 500,
    ago: "2m",
  },
  {
    id: "a2",
    user: "rafi_dev",
    kind: "capture",
    challenge: "Indirect Injection",
    points: 372,
    ago: "4m",
  },
  {
    id: "a3",
    user: "mehjabin",
    kind: "capture",
    challenge: "Hybrid Search",
    points: 136,
    ago: "6m",
  },
  {
    id: "a4",
    user: "you",
    isYou: true,
    kind: "capture",
    challenge: "PII Redaction",
    points: 248,
    ago: "9m",
  },
  {
    id: "a5",
    user: "sakib-r",
    kind: "capture",
    challenge: "Jailbreak Thresholds",
    points: 380,
    ago: "12m",
  },
  {
    id: "a6",
    user: "zayan.a",
    kind: "capture",
    challenge: "Chunking Caps",
    points: 142,
    ago: "15m",
  },
];

const SOLVED_MOCK: Record<string, string> = {
  "eval-slice": "0:51",
  "exfil-pii": "1:12",
  "rag-hybrid": "0:14",
  "rag-chunk": "0:22",
};

const ATTEMPTED: Record<string, number> = {
  "grd-fpfn": 3,
};

function problemForDef(contest: ContestDetail, def: PlayChallengeDef) {
  if (def.problemSlug) {
    return contest.problems.find((p) => p.slug === def.problemSlug);
  }
  return contest.problems.find((p) => p.slug.includes(def.id));
}

export function buildPlayBoard(contest: ContestDetail): PlayBoardChallenge[] {
  return MOCK_PLAY_CHALLENGES.map((def) => {
    const problem = problemForDef(contest, def);
    let variant: PlayBoardChallenge["variant"] = "open";
    if (problem?.scored) {
      variant = "solved";
    } else if (problem?.verdict && problem.verdict !== "unseen") {
      variant = "attempted";
    } else if (SOLVED_MOCK[def.id]) {
      variant = "solved";
    } else if (ATTEMPTED[def.id]) {
      variant = "attempted";
    }

    const solveTime = SOLVED_MOCK[def.id];
    const attemptTries = ATTEMPTED[def.id];

    return {
      ...def,
      variant,
      solveTime,
      attemptTries,
      currentPoints: dynamicPoints(def.base, def.solves),
    };
  });
}

export function buildPlayHud(
  contest: ContestDetail,
  rank: number | null,
  rankDelta: number,
): PlayEntryHud {
  const solved = contest.problems.filter((p) => p.scored).length;
  const mockSolved = Object.keys(SOLVED_MOCK).length;
  return {
    rank,
    rankDelta,
    points: contest.scorecard?.totalScore ?? contest.totalScore ?? 1085,
    maxPoints: 5200,
    flags: Math.max(solved, 4),
    totalFlags: 15,
    firstBloods: 0,
    personalDeadlineAt: contest.personalDeadlineAt,
    elapsedMs: contest.scorecard?.elapsedMs ?? contest.elapsedMs ?? null,
  };
}

export function challengeById(id: string): PlayBoardChallenge | undefined {
  const def = MOCK_PLAY_CHALLENGES.find((c) => c.id === id);
  if (!def) {
    return undefined;
  }
  return {
    ...def,
    variant: SOLVED_MOCK[id] ? "solved" : ATTEMPTED[id] ? "attempted" : "open",
    solveTime: SOLVED_MOCK[id],
    attemptTries: ATTEMPTED[id],
    currentPoints: dynamicPoints(def.base, def.solves),
  };
}

export function launchSlug(challenge: PlayChallengeDef, contest: ContestDetail): string {
  return (
    challenge.problemSlug ??
    contest.problems.find((p) => p.slug.includes(challenge.id))?.slug ??
    challenge.id
  );
}
