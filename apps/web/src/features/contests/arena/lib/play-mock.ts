import type { ContestDetail } from "@/types/contest";
import type { PlayBoardChallenge, PlayEntryHud } from "./play-types";

export {
  buildPlayBoard,
  challengeById,
  formatChallengeSolveTime,
  launchSlug,
} from "./play-board";

export function buildPlayHud(
  contest: ContestDetail,
  rank: number | null,
  rankDelta: number,
): PlayEntryHud {
  const totalFlags = contest.problems.length || contest.sampledCount || contest.problemCount;
  const solved = contest.problems.filter((p) => p.scored).length;
  const maxPoints =
    contest.maxScore > 0
      ? contest.maxScore
      : contest.pointsPerProblem * Math.max(totalFlags, 1);
  const points = contest.totalScore ?? contest.scorecard?.totalScore ?? 0;
  return {
    rank,
    rankDelta,
    points,
    maxPoints,
    flags: solved,
    totalFlags,
    firstBloods: 0,
    personalDeadlineAt: contest.personalDeadlineAt,
    elapsedMs: contest.scorecard?.elapsedMs ?? contest.elapsedMs ?? null,
  };
}

/** @deprecated Storybook / dev only — production board uses {@link buildPlayBoard}. */
export type { PlayBoardChallenge };
