export const CONTEST_LEADERBOARD_RULE =
  'Contest score (sum of sampled items), then elapsed time as tie-break.';

export type ContestRankRow = {
  slug: string;
  totalScore: number;
  elapsedMs: number;
};

export function sortContestRows<T extends ContestRankRow>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    if (right.totalScore !== left.totalScore) {
      return right.totalScore - left.totalScore;
    }
    if (left.elapsedMs !== right.elapsedMs) {
      return left.elapsedMs - right.elapsedMs;
    }
    return left.slug.localeCompare(right.slug);
  });
}
