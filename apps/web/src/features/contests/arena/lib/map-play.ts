import type { ContestDetail, ContestProblem } from "@/types/contest";
import {
  normalizeDifficulty,
  type ArenaCategoryId,
  type ArenaDifficulty,
} from "./categories";
import { LOBBY_MAX_PTS } from "./map-lobby";
import { dynamicPoints } from "./points";

export type PlayChallenge = {
  slug: string;
  title: string;
  categoryId: ArenaCategoryId;
  difficulty: ArenaDifficulty;
  basePoints: number;
  solves: number;
  firstBloodUser?: string;
  variant: "open" | "solved" | "attempted";
  href?: string;
  solveLabel?: string;
};

function categoryFromSlug(slug: string): ArenaCategoryId {
  if (slug.startsWith("grd-")) {
    return "guardrails";
  }
  if (slug.includes("inject") || slug.includes("payload")) {
    return "prompt-injection";
  }
  if (slug.startsWith("rag-")) {
    return "retrieval";
  }
  if (slug.includes("eval")) {
    return "evals";
  }
  return "retrieval";
}

export function mockSolveTime(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h + slug.charCodeAt(i) * 13) % 3600;
  }
  const m = Math.floor(h / 60);
  const s = h % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function mockAttemptTries(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h + slug.charCodeAt(i)) % 5;
  }
  return 2 + h;
}

function mockSolves(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h + slug.charCodeAt(i) * 17) % 140;
  }
  return 20 + h;
}

export function mapProblemToPlayChallenge(
  problem: ContestProblem,
  contest: ContestDetail,
  entryOver: boolean,
): PlayChallenge {
  const base = problem.score ?? contest.pointsPerProblem;
  const solves = mockSolves(problem.slug);
  const scored = problem.scored && problem.score != null;
  let variant: PlayChallenge["variant"] = "open";
  if (scored) {
    variant = "solved";
  } else if (problem.verdict && problem.verdict !== "unseen") {
    variant = "attempted";
  }

  return {
    slug: problem.slug,
    title: problem.title,
    categoryId: categoryFromSlug(problem.slug),
    difficulty: normalizeDifficulty(problem.difficulty),
    basePoints: base,
    solves,
    firstBloodUser: solves > 0 ? "nadia.k" : undefined,
    variant,
    href: entryOver ? undefined : undefined, // set by caller with routes
    solveLabel: scored ? "PWNED" : undefined,
  };
}

export function playMaxPoints(contest: ContestDetail): number {
  return Math.max(contest.maxScore || 0, LOBBY_MAX_PTS);
}

export function currentPointsForDisplay(base: number, solves: number): number {
  return dynamicPoints(base, solves);
}
