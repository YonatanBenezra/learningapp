import { createHash } from 'node:crypto';
import type { Contest } from '@prisma/client';
import { resolveSampledSlugs } from './contest-sample';
import { samplingModeFromDb } from './contest-scoring';

export function virtualSampleSeed(userId: string, contestId: string): string {
  return createHash('sha256')
    .update(`virtual:${userId}:${contestId}`)
    .digest('hex')
    .slice(0, 32);
}

export function resolveVirtualSampledSlugs(
  contest: Pick<
    Contest,
    'id' | 'sampleSize' | 'samplingMode'
  >,
  pool: readonly string[],
  userId: string,
): string[] {
  const seed = virtualSampleSeed(userId, contest.id);
  return resolveSampledSlugs(
    pool,
    contest.sampleSize,
    seed,
    samplingModeFromDb(contest.samplingMode),
  );
}
