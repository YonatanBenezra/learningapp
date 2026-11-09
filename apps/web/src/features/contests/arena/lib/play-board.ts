import type { ContestDetail, ContestProblem } from "@/types/contest";
import { ARENA_CATEGORIES, categoryForContestProblem, normalizeDifficulty } from "./categories";
import type { ArenaCategoryId } from "./categories";
import { dynamicPoints } from "./points";
import type { PlayBoardChallenge } from "./play-types";

function codeFromSlug(slug: string): string {
  const parts = slug.split("-");
  if (parts.length >= 2) {
    return `${parts[0]!.toUpperCase()}-${parts[1]}`;
  }
  return slug.slice(0, 12).toUpperCase();
}

export function formatChallengeSolveTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function variantForProblem(problem: ContestProblem): PlayBoardChallenge["variant"] {
  if (problem.scored) {
    return "solved";
  }
  if (problem.verdict && problem.verdict !== "unseen" && problem.verdict !== "pending") {
    return "attempted";
  }
  return "open";
}

function resolveCategoryId(problem: ContestProblem): ArenaCategoryId {
  const fromApi = problem.arenaCategory;
  if (fromApi && fromApi in ARENA_CATEGORIES) {
    return fromApi;
  }
  return categoryForContestProblem(problem);
}

function mapProblemToChallenge(
  problem: ContestProblem,
  contest: ContestDetail,
): PlayBoardChallenge {
  const base = contest.pointsPerProblem;
  const variant = variantForProblem(problem);
  const solves = 0;
  const currentPoints =
    problem.score != null && variant === "solved"
      ? problem.score
      : dynamicPoints(base, solves);
  const solveTime =
    variant === "solved" && problem.solvedElapsedMs != null
      ? formatChallengeSolveTime(problem.solvedElapsedMs)
      : undefined;

  return {
    id: problem.slug,
    problemSlug: problem.slug,
    title: problem.title,
    categoryId: resolveCategoryId(problem),
    difficulty: normalizeDifficulty(problem.difficulty),
    base,
    solves,
    code: codeFromSlug(problem.slug),
    objective: undefined,
    passCriteria: undefined,
    knobs: undefined,
    ratingVotes: undefined,
    variant,
    solveTime,
    currentPoints,
  };
}

/** Arena grid from the entrant's contest problems (API source of truth). */
export function buildPlayBoard(contest: ContestDetail): PlayBoardChallenge[] {
  return contest.problems.map((problem) => mapProblemToChallenge(problem, contest));
}

export function challengeById(
  contest: ContestDetail,
  id: string,
): PlayBoardChallenge | undefined {
  return buildPlayBoard(contest).find((c) => c.id === id);
}

export function launchSlug(challenge: { problemSlug?: string; id: string }): string {
  return challenge.problemSlug ?? challenge.id;
}
