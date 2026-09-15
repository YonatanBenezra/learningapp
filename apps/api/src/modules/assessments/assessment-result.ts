import type { ContestKind } from '@prisma/client';
import { va1BandForTotalScore, VA1_MAX_ITEM_SCORE } from './va1-bands';

export type AssessmentResultItem = {
  slug: string;
  title: string;
  verdict: string;
  score: number;
};

export type AssessmentResultSkill = {
  slug: string;
  name: string;
  score: number;
  problems: number;
};

export type AssessmentResult = {
  band: string;
  bandLabel: string;
  totalScore: number;
  maxScore: number;
  elapsedMs: number;
  timeBoxMinutes: number;
  seasonKey: string | null;
  sampleCount: number;
  sampleSeed: string;
  window: {
    startsAt: string;
    endsAt: string;
  };
  items: AssessmentResultItem[];
  skills: AssessmentResultSkill[];
};

type BuildAssessmentResultInput = {
  kind: ContestKind;
  seasonKey: string | null;
  startsAt: Date;
  endsAt: Date;
  timeBoxMinutes: number;
  sampleSeed: string;
  elapsedMs: number;
  problems: AssessmentResultItem[];
  skillsByProblem: Map<string, { slug: string; name: string }[]>;
};

const FORBIDDEN_RESULT_TOKENS = ['HIDDEN_EVAL', 'eval_hidden', 'canary'] as const;

export function buildAssessmentResult(
  input: BuildAssessmentResultInput,
): AssessmentResult | null {
  if (input.kind !== 'assessment') {
    return null;
  }

  const maxScore = input.problems.length * VA1_MAX_ITEM_SCORE;
  const totalScore = input.problems.reduce((sum, item) => sum + item.score, 0);
  const band = va1BandForTotalScore(totalScore);
  const skillMap = new Map<string, AssessmentResultSkill>();

  for (const problem of input.problems) {
    const tags = input.skillsByProblem.get(problem.slug) ?? [];
    for (const tag of tags) {
      const current = skillMap.get(tag.slug);
      if (current) {
        current.score += problem.score;
        current.problems += 1;
      } else {
        skillMap.set(tag.slug, {
          slug: tag.slug,
          name: tag.name,
          score: problem.score,
          problems: 1,
        });
      }
    }
  }

  const skills = [...skillMap.values()]
    .map((row) => ({
      ...row,
      score: Math.round(row.score / row.problems),
    }))
    .sort((left, right) => left.slug.localeCompare(right.slug));

  const result: AssessmentResult = {
    band: band.id,
    bandLabel: band.label,
    totalScore,
    maxScore,
    elapsedMs: input.elapsedMs,
    timeBoxMinutes: input.timeBoxMinutes,
    seasonKey: input.seasonKey,
    sampleCount: input.problems.length,
    sampleSeed: input.sampleSeed,
    window: {
      startsAt: input.startsAt.toISOString(),
      endsAt: input.endsAt.toISOString(),
    },
    items: input.problems,
    skills,
  };

  assertPublicSafeResult(result);
  return result;
}

export function assertPublicSafeResult(result: AssessmentResult): void {
  const serialized = JSON.stringify(result).toLowerCase();
  for (const token of FORBIDDEN_RESULT_TOKENS) {
    if (serialized.includes(token.toLowerCase())) {
      throw new Error(`Assessment result leaks forbidden token: ${token}`);
    }
  }
}
