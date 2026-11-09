import { createHash } from 'node:crypto';
import { samplingModeFromDb } from './contest-scoring';

export type ContestProblemRef = {
  position: number;
  exerciseSlug: string;
};

export function sampleFromPool(
  pool: readonly string[],
  sampleSize: number,
  seed: string,
): string[] {
  const ranked = [...pool]
    .map((slug) => ({
      slug,
      rank: createHash('sha256').update(`${seed}:${slug}`).digest('hex'),
    }))
    .sort((left, right) => left.rank.localeCompare(right.rank));
  return ranked
    .slice(0, Math.min(sampleSize, pool.length))
    .map((row) => row.slug);
}

/** LeetCode weekly: full pool in catalog order. Smaller pools use seeded shuffle. */
export function resolveSampledSlugs(
  pool: readonly string[],
  sampleSize: number,
  seed: string,
  samplingMode: 'fixed_pool' | 'per_user' = 'per_user',
): string[] {
  const size = Math.min(sampleSize, pool.length);
  if (size === 0) {
    return [];
  }
  if (samplingMode === 'fixed_pool' || size === pool.length) {
    return pool.slice(0, size);
  }
  return sampleFromPool(pool, sampleSize, seed);
}

export function contestPoolSlugs(
  problems: ContestProblemRef[],
  sampleSize: number,
): string[] {
  return [...problems]
    .sort((left, right) => left.position - right.position)
    .map((row) => row.exerciseSlug)
    .slice(0, sampleSize);
}

/** Live board slugs: fixed_pool always follows the contest catalog (not frozen entry slugs). */
export function entrantSlugs(
  contest: {
    samplingMode: Parameters<typeof samplingModeFromDb>[0];
    sampleSize: number;
    problems: ContestProblemRef[];
  },
  entry: { sampledSlugs: string[] } | null,
): string[] {
  const pool = contestPoolSlugs(contest.problems, contest.sampleSize);
  if (samplingModeFromDb(contest.samplingMode) === 'fixed_pool') {
    return pool;
  }
  return entry?.sampledSlugs.length ? entry.sampledSlugs : pool;
}

export function sameSlugList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((slug, index) => slug === b[index]);
}
