import { createHash } from 'node:crypto';

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
