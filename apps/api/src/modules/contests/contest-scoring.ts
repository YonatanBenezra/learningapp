import type { Contest, ContestSamplingMode } from '@prisma/client';

export type SamplingMode = 'fixed_pool' | 'per_user';

export function samplingModeFromDb(mode: ContestSamplingMode): SamplingMode {
  return mode === 'fixed_pool' ? 'fixed_pool' : 'per_user';
}

export function contestMaxScore(
  sampleCount: number,
  pointsPerProblem: number,
): number {
  return sampleCount * pointsPerProblem;
}

export function contestScoringMeta(
  contest: Pick<Contest, 'sampleSize' | 'pointsPerProblem' | 'samplingMode'>,
  sampledCount: number,
) {
  const pointsPerProblem = contest.pointsPerProblem;
  return {
    pointsPerProblem,
    samplingMode: samplingModeFromDb(contest.samplingMode),
    maxScore: contestMaxScore(sampledCount, pointsPerProblem),
  };
}
