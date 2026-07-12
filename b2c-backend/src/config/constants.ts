export const TIERS = ['free', 'premium'] as const;
export const DOMAINS = ['programming', 'networking', 'cybersecurity', 'os', 'general'] as const;
export const COURSE_STATUS = ['generating', 'ready', 'failed', 'archived', 'completed'] as const;

// Per-tier limits — PLACEHOLDER numbers, confirm with Yonatan (§0, §9).
export const TIER_LIMITS = {
  free: {
    activeCourses: 1,
    courseGenerationsPerDay: 3,
    exerciseGenerationsPerDay: 20,
    quizGenerationsPerDay: 20,
    examGenerationsPerDay: 5,
    labExecutionsPerDay: 100,
  },
  premium: {
    activeCourses: 25,
    courseGenerationsPerDay: 50,
    exerciseGenerationsPerDay: 500,
    quizGenerationsPerDay: 500,
    examGenerationsPerDay: 100,
    labExecutionsPerDay: 5000,
  },
} as const;
