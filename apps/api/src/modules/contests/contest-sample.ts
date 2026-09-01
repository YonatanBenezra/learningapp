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
  return ranked.slice(0, Math.min(sampleSize, pool.length)).map((row) => row.slug);
}
