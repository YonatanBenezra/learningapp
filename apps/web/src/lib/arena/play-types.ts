import type { ArenaCategoryId, ArenaDifficulty } from "./categories";

export type PlayChallengeDef = {
  id: string;
  problemSlug?: string;
  title: string;
  categoryId: ArenaCategoryId;
  difficulty: ArenaDifficulty;
  base: number;
  solves: number;
  firstBlood?: { user: string; afterSec: number };
  objective: string;
  passCriteria: {
    metric: string;
    threshold: string;
    budget: string;
  };
  knobs: string[];
  ratingVotes: number[];
  code: string;
};

export type PlayBoardChallenge = PlayChallengeDef & {
  variant: "open" | "solved" | "attempted";
  solveTime?: string;
  attemptTries?: number;
  currentPoints: number;
};

export type PlayEntryHud = {
  rank: number | null;
  rankDelta: number;
  points: number;
  maxPoints: number;
  flags: number;
  totalFlags: number;
  firstBloods: number;
  personalDeadlineAt: string | null;
  elapsedMs: number | null;
};

export type AroundYouRow = {
  rank: number;
  name: string;
  score: number;
  isYou?: boolean;
};

export type ActivityRow = {
  id: string;
  user: string;
  isYou?: boolean;
  kind: "capture" | "firstBlood";
  challenge: string;
  points?: number;
  ago: string;
};
