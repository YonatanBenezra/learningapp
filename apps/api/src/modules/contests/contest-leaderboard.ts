import type { ContestEntryStatus } from '@prisma/client';

export type LeaderboardSortRow = {
  totalScore: number;
  elapsedMs: number | null;
  startedAt: Date;
};

/** Higher score wins; tie-break by lower elapsed; active (null elapsed) sorts after finished at same score. */
export function compareLeaderboardRows(
  left: LeaderboardSortRow,
  right: LeaderboardSortRow,
): number {
  if (right.totalScore !== left.totalScore) {
    return right.totalScore - left.totalScore;
  }
  const leftElapsed = left.elapsedMs ?? Number.POSITIVE_INFINITY;
  const rightElapsed = right.elapsedMs ?? Number.POSITIVE_INFINITY;
  if (leftElapsed !== rightElapsed) {
    return leftElapsed - rightElapsed;
  }
  return left.startedAt.getTime() - right.startedAt.getTime();
}

export function assignRanks<T extends LeaderboardSortRow>(rows: T[]): (T & { rank: number })[] {
  const sorted = [...rows].sort(compareLeaderboardRows);
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export type LeaderboardEntryRow = {
  userId: string;
  displayName: string;
  profileSlug: string | null;
  totalScore: number;
  elapsedMs: number | null;
  solvedCount: number;
  totalCount: number;
  status: ContestEntryStatus;
  startedAt: Date;
};

export function countGradedSlugs(
  sampledSlugs: string[],
  attempts: Array<{
    exercise: { slug: string };
    submissions: Array<{
      runs: Array<{ grade: unknown | null }>;
    }>;
  }>,
): number {
  const graded = new Set<string>();
  for (const attempt of attempts) {
    const grade = attempt.submissions[0]?.runs[0]?.grade;
    if (grade) {
      graded.add(attempt.exercise.slug);
    }
  }
  return sampledSlugs.filter((slug) => graded.has(slug)).length;
}
