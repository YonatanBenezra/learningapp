export const LEADERBOARD_RULE =
  'Rating = solves × 100 − hint points + passes in the last 30 days. On a problem you solve, hints cost 0, 5, 10… points (at most 50).';

/** Points a hint costs on a problem you solve: the first is free. */
export function hintCost(hintIndex: number): number {
  return Math.max(0, hintIndex) * 5;
}

/** A solved problem is always worth at least half its points. */
export const MAX_HINT_POINTS_PER_PROBLEM = 50;

/**
 * Hint points charged across solved problems: the cost of every unlocked
 * hint, capped per problem. Hints on problems you have not solved are free.
 */
export function hintPointsSpent(
  unlocks: { slug: string; hintIndex: number }[],
  solvedSlugs: Set<string>,
): number {
  const bySlug = new Map<string, number>();
  for (const unlock of unlocks) {
    if (!solvedSlugs.has(unlock.slug)) {
      continue;
    }
    bySlug.set(
      unlock.slug,
      (bySlug.get(unlock.slug) ?? 0) + hintCost(unlock.hintIndex),
    );
  }
  let total = 0;
  for (const points of bySlug.values()) {
    total += Math.min(points, MAX_HINT_POINTS_PER_PROBLEM);
  }
  return total;
}

export const RECENT_PASS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type LeaderboardSortRow = {
  slug: string;
  solves: number;
  recentPasses: number;
  /** Points spent on hints for solved problems. */
  hintPoints?: number;
};

export function leaderboardRating(
  solves: number,
  recentPasses: number,
  hintPoints = 0,
): number {
  return solves * 100 - hintPoints + recentPasses;
}

export function sortLeaderboardRows<T extends LeaderboardSortRow>(
  rows: T[],
): T[] {
  const rating = (row: T) =>
    leaderboardRating(row.solves, row.recentPasses, row.hintPoints ?? 0);
  return [...rows].sort((left, right) => {
    if (rating(right) !== rating(left)) {
      return rating(right) - rating(left);
    }
    if (right.solves !== left.solves) {
      return right.solves - left.solves;
    }
    if (right.recentPasses !== left.recentPasses) {
      return right.recentPasses - left.recentPasses;
    }
    return left.slug.localeCompare(right.slug);
  });
}
