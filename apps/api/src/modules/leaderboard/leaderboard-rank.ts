export const LEADERBOARD_RULE =
  'Unique verified solves, then pass count in the last 30 days. Contest rating replaces this after Step 10.';

export const RECENT_PASS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type LeaderboardSortRow = {
  slug: string;
  solves: number;
  recentPasses: number;
};

export function leaderboardRating(solves: number, recentPasses: number): number {
  return solves * 100 + recentPasses;
}

export function sortLeaderboardRows<T extends LeaderboardSortRow>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    if (right.solves !== left.solves) {
      return right.solves - left.solves;
    }
    if (right.recentPasses !== left.recentPasses) {
      return right.recentPasses - left.recentPasses;
    }
    return left.slug.localeCompare(right.slug);
  });
}
