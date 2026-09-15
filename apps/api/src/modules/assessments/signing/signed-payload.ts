import type { AssessmentResult } from '../assessment-result';

/** Payload signed by LabPath — public-safe, no hidden eval. */
export type SignedAssessmentPayload = {
  v: 1;
  resultId: string;
  assessmentSlug: string;
  seasonKey: string | null;
  issuedAt: string;
  band: string;
  bandLabel: string;
  totalScore: number;
  maxScore: number;
  elapsedMs: number;
  timeBoxMinutes: number;
  sampleCount: number;
  sampleSeed: string;
  window: {
    startsAt: string;
    endsAt: string;
  };
  items: AssessmentResult['items'];
  skills: AssessmentResult['skills'];
};

export function toSignedPayload(input: {
  resultId: string;
  assessmentSlug: string;
  issuedAt: Date;
  result: AssessmentResult;
}): SignedAssessmentPayload {
  return {
    v: 1,
    resultId: input.resultId,
    assessmentSlug: input.assessmentSlug,
    seasonKey: input.result.seasonKey,
    issuedAt: input.issuedAt.toISOString(),
    band: input.result.band,
    bandLabel: input.result.bandLabel,
    totalScore: input.result.totalScore,
    maxScore: input.result.maxScore,
    elapsedMs: input.result.elapsedMs,
    timeBoxMinutes: input.result.timeBoxMinutes,
    sampleCount: input.result.sampleCount,
    sampleSeed: input.result.sampleSeed,
    window: input.result.window,
    items: input.result.items,
    skills: input.result.skills,
  };
}
