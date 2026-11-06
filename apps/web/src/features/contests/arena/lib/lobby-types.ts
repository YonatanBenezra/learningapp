import type { ArenaCategoryId, ArenaDifficulty } from "./categories";

export type LobbyRule = { num: string; text: string };

export type LobbyCategoryRow = {
  categoryId: ArenaCategoryId;
  count: number;
  points: number;
};

export type LobbyChallengePreview = {
  id: string;
  title: string;
  categoryId: ArenaCategoryId;
  difficulty: ArenaDifficulty;
  basePoints: number;
  solves: number;
  firstBloodUser: string;
};

export type LobbyScoreboardRow = {
  rank: number;
  name: string;
  score: number;
  initials: string;
};

export type LobbyEvent = {
  slug: string;
  title: string;
  subtitle: string;
  startsAt: string;
  endsAt: string;
  clockMinutes: number;
  maxPoints: number;
  operatorCount: number;
  challengeCount: number;
  hintsOff: boolean;
  difficultyLabel: string;
  window: "upcoming" | "open" | "closed";
  canEnter: boolean;
  entered: boolean;
  rules: LobbyRule[];
  categories: LobbyCategoryRow[];
  challengePreviews: LobbyChallengePreview[];
  scoreboard: LobbyScoreboardRow[];
};
