export const TIERS = ['free', 'standard', 'premium'] as const;
export const DOMAINS = ['programming', 'networking', 'cybersecurity', 'os', 'general'] as const;
export const COURSE_STATUS = ['generating', 'ready', 'failed', 'archived', 'completed'] as const;

/** New accounts get this many days of platform access before a paid subscription is required. */
export const TRIAL_PERIOD_DAYS = 90;

export const TIER_LIMITS = {
  free: {
    activeAssessments: 5,
    activeCourses: 5,
    courseGenerationsPerDay: 5,
    exerciseGenerationsPerDay: 20,
    quizGenerationsPerMonth: 20,
    examGenerationsPerMonth: 20,
    labExecutionsPerDay: 100,
  },
  standard: {
    activeAssessments: 20,
    activeCourses: 20,
    courseGenerationsPerDay: 20,
    exerciseGenerationsPerDay: 50,
    quizGenerationsPerMonth: 50,
    examGenerationsPerMonth: 50,
    labExecutionsPerDay: 500,
  },
  premium: {
    activeAssessments: Number.POSITIVE_INFINITY,
    activeCourses: Number.POSITIVE_INFINITY,
    courseGenerationsPerDay: Number.POSITIVE_INFINITY,
    exerciseGenerationsPerDay: Number.POSITIVE_INFINITY,
    quizGenerationsPerMonth: Number.POSITIVE_INFINITY,
    examGenerationsPerMonth: Number.POSITIVE_INFINITY,
    labExecutionsPerDay: Number.POSITIVE_INFINITY,
  },
} as const;

export type Tier = (typeof TIERS)[number];

export function normalizeTier(tier?: string | null): Tier {
  if (tier === 'premium' || tier === 'standard') return tier;
  return 'free';
}

export function isPaidTier(tier?: string | null): boolean {
  const normalized = normalizeTier(tier);
  return normalized === 'standard' || normalized === 'premium';
}

export function tierLimits(tier?: string | null) {
  return TIER_LIMITS[normalizeTier(tier)];
}

export function isUnlimitedLimit(value: number): boolean {
  return !Number.isFinite(value);
}

export function formatLimit(value: number): string {
  return isUnlimitedLimit(value) ? 'Unlimited' : String(value);
}
