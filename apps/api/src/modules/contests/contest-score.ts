import type { Grade } from '@prisma/client';

export function gradeScore0to100(
  grade: Pick<Grade, 'verdict' | 'metrics'>,
): number {
  const metrics = grade.metrics as Record<string, { value?: number }> | null;
  if (metrics && typeof metrics.field_accuracy?.value === 'number') {
    return Math.round(metrics.field_accuracy.value * 100);
  }
  if (metrics && typeof metrics.pass?.value === 'number') {
    return Math.round(metrics.pass.value * 100);
  }
  return grade.verdict === 'pass' ? 100 : 0;
}

export function scaleItemScore(
  raw0to100: number,
  pointsPerProblem: number,
): number {
  if (pointsPerProblem === 100) {
    return raw0to100;
  }
  return Math.round((raw0to100 / 100) * pointsPerProblem);
}

export function itemScoreFromGrade(
  grade: Pick<Grade, 'verdict' | 'metrics'>,
  pointsPerProblem = 100,
): number {
  return scaleItemScore(gradeScore0to100(grade), pointsPerProblem);
}

export function sumItemScores(scores: number[]): number {
  return scores.reduce((total, score) => total + score, 0);
}
