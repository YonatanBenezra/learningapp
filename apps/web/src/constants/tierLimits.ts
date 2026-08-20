import { TIER_LIMITS } from '@/src/constants/pricing';
import type { Tier } from '@/src/domain/user';

export function activeCourseLimitForTier(tier: Tier): number | null {
  const value = TIER_LIMITS[tier].courses;
  return typeof value === 'number' ? value : null;
}

export const MIN_COURSE_TOPICS = 5;

export function topicLimitForTier(tier: Tier): number | null {
  if (tier === 'free') return 6;
  return null;
}

export function assessmentLimitForTier(tier: Tier): number | null {
  const value = TIER_LIMITS[tier].assessments;
  return typeof value === 'number' ? value : null;
}

export function formatPlanLimit(value: number | string | null): string {
  if (value === null || value === 'Unlimited') return 'Unlimited';
  return String(value);
}

export function tierPlanLabel(tier: string): string {
  if (tier === 'premium') return 'Premium';
  if (tier === 'standard') return 'Standard';
  return 'Free';
}

export function isAssessmentQuotaExhausted(quota?: {
  limit: number | null;
  remaining: number | null;
}): boolean {
  return quota?.limit != null && quota.remaining === 0;
}
