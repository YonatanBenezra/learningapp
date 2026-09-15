import type { SignedAssessmentPayload } from './signing/signed-payload';

export type PublicVerifiedResult = {
  id: string;
  assessmentSlug: string;
  band: string;
  bandLabel: string;
  issuedAt: string;
  totalScore: number;
  maxScore: number;
  timeBoxMinutes: number;
  skills: { slug: string; name: string; score: number }[];
};

export function toPublicVerifiedResult(row: {
  id: string;
  assessmentSlug: string;
  issuedAt: Date;
  payload: unknown;
}): PublicVerifiedResult {
  const payload = row.payload as SignedAssessmentPayload;
  return {
    id: row.id,
    assessmentSlug: row.assessmentSlug,
    band: payload.band,
    bandLabel: payload.bandLabel,
    issuedAt: row.issuedAt.toISOString(),
    totalScore: payload.totalScore,
    maxScore: payload.maxScore,
    timeBoxMinutes: payload.timeBoxMinutes,
    skills: payload.skills.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      score: skill.score,
    })),
  };
}
