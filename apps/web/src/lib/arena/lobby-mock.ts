import type {
  LobbyCategoryRow,
  LobbyChallengePreview,
  LobbyEvent,
  LobbyRule,
  LobbyScoreboardRow,
} from "./lobby-types";

export const LOBBY_RULES: LobbyRule[] = [
  {
    num: "01",
    text: "Same 15 challenges for every operator — a fixed draw for this weekly event.",
  },
  {
    num: "02",
    text: "Your 180-minute operation clock starts the moment you join. It can't be paused.",
  },
  {
    num: "03",
    text: "Pass a challenge's hidden grader to capture its flag. Failed runs cost nothing.",
  },
  {
    num: "04",
    text: "Dynamic scoring: each flag starts at its base value and decays as solves rise (floor 50%).",
  },
  {
    num: "05",
    text: "First operator to capture a flag earns First Blood. Ties broken by earliest capture time.",
  },
  {
    num: "06",
    text: "Hints are disabled. After the event ends, every challenge reopens in unranked replay.",
  },
];

export const LOBBY_CATEGORIES: LobbyCategoryRow[] = [
  { categoryId: "prompt-injection", count: 2, points: 800 },
  { categoryId: "retrieval", count: 5, points: 1700 },
  { categoryId: "guardrails", count: 4, points: 1600 },
  { categoryId: "evals", count: 2, points: 600 },
  { categoryId: "exfiltration", count: 2, points: 500 },
];

export const LOBBY_CHALLENGE_PREVIEWS: LobbyChallengePreview[] = [
  {
    id: "hybrid-search",
    title: "Hybrid Search Weighting",
    categoryId: "retrieval",
    difficulty: "Easy",
    basePoints: 200,
    solves: 112,
    firstBloodUser: "nadia.k",
  },
  {
    id: "two-stage-rerank",
    title: "Two-Stage Retrieve + Rerank",
    categoryId: "retrieval",
    difficulty: "Hard",
    basePoints: 400,
    solves: 38,
    firstBloodUser: "nadia.k",
  },
  {
    id: "defense-depth",
    title: "Defense in Depth — Advanced Stack",
    categoryId: "guardrails",
    difficulty: "Insane",
    basePoints: 500,
    solves: 6,
    firstBloodUser: "nadia.k",
  },
];

export const LOBBY_SCOREBOARD: LobbyScoreboardRow[] = [
  { rank: 1, name: "nadia.k", score: 4820, initials: "NK" },
  { rank: 2, name: "rafi_dev", score: 4412, initials: "RD" },
  { rank: 3, name: "tanvir.ml", score: 4180, initials: "TM" },
  { rank: 4, name: "sakib-r", score: 3904, initials: "SR" },
  { rank: 5, name: "mehjabin", score: 3655, initials: "MJ" },
  { rank: 6, name: "arif.codes", score: 3410, initials: "AC" },
  { rank: 7, name: "labrat42", score: 3122, initials: "L4" },
  { rank: 8, name: "zayan.a", score: 2980, initials: "ZA" },
];

export function defaultLobbySubtitle(): string {
  return "Fifteen RAG & Guardrails challenges. Your config is graded on a hidden set — pass the bar and the flag is yours. Points decay as more operators solve, so speed matters.";
}

export function buildLobbyFromApi(partial: {
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  clockMinutes: number;
  maxPoints: number;
  operatorCount: number;
  challengeCount: number;
  window: LobbyEvent["window"];
  canEnter: boolean;
  entered: boolean;
  subtitle?: string;
}): LobbyEvent {
  return {
    ...partial,
    subtitle: partial.subtitle ?? defaultLobbySubtitle(),
    hintsOff: true,
    difficultyLabel: "ADVANCED",
    rules: LOBBY_RULES,
    categories: LOBBY_CATEGORIES,
    challengePreviews: LOBBY_CHALLENGE_PREVIEWS,
    scoreboard: LOBBY_SCOREBOARD,
  };
}
