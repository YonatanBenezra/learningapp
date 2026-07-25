export const TRIAL_PERIOD_MONTHS = 3;
export const TRIAL_PERIOD_DAYS = 90;
export const STANDARD_PRICE_USD = 34;
export const PREMIUM_PRICE_USD = 150;

export const TIER_LIMITS = {
  free: {
    assessments: 5,
    courses: 5,
    quiz: 20,
    exam: 20,
    practice: 20,
  },
  standard: {
    assessments: 20,
    courses: 20,
    quiz: 50,
    exam: 50,
    practice: 50,
  },
  premium: {
    assessments: 'Unlimited',
    courses: 'Unlimited',
    quiz: 'Unlimited',
    exam: 'Unlimited',
    practice: 'Unlimited',
  },
} as const;

export const FREE_PLAN_FEATURES = [
  '5 skill assessments',
  '5 active AI courses',
  '20 quizzes per month',
  '20 exams per month',
  '20 practice sessions per day',
  'Basic code sandbox labs',
  'Streaks & achievements',
] as const;

export const STANDARD_PLAN_FEATURES = [
  `${TRIAL_PERIOD_MONTHS} months free to start`,
  '20 skill assessments',
  '20 active AI courses',
  '50 quizzes per month',
  '50 exams per month',
  '50 practice sessions per day',
  'Hands-on labs & progress tracking',
  'Full platform access',
] as const;

export const TRIAL_PLAN_FEATURES = [
  '3 months free — no credit card required',
  `${TIER_LIMITS.free.courses} active AI courses`,
  `${TIER_LIMITS.free.quiz} quizzes & ${TIER_LIMITS.free.exam} exams / month`,
  `${TIER_LIMITS.free.practice} practice / day`,
  `${TIER_LIMITS.free.assessments} skill assessments`,
  'Streaks & achievements',
  'Full data export & deletion',
] as const;

export const PREMIUM_ONLY_FEATURES = [
  'Unlimited skill assessments',
  'Unlimited active courses',
  'Unlimited quizzes & exams',
  'Priority AI generation & grading',
  'Advanced SOC & network labs',
] as const;

export const TRIAL_INCLUDED_FEATURES = FREE_PLAN_FEATURES;

export const PREMIUM_PLAN_FEATURES = [
  'Unlimited skill assessments',
  'Unlimited active AI courses',
  'Unlimited quizzes per month',
  'Unlimited exams per month',
  'Unlimited practice sessions per day',
  'Priority AI generation & grading',
  'Advanced SOC & network labs',
] as const;

export const PLAN_COMPARISON = [
  { feature: 'Platform access', free: '3 months trial', standard: 'Paid subscription', premium: 'Paid subscription' },
  { feature: 'Skill assessments', free: '5', standard: '20', premium: 'Unlimited' },
  { feature: 'Active AI courses', free: '5', standard: '20', premium: 'Unlimited' },
  { feature: 'Quizzes / month', free: '20', standard: '50', premium: 'Unlimited' },
  { feature: 'Exams / month', free: '20', standard: '50', premium: 'Unlimited' },
  { feature: 'Practice / day', free: '20', standard: '50', premium: 'Unlimited' },
  { feature: 'Priority queue', free: '—', standard: '—', premium: 'Yes' },
  { feature: 'Advanced SOC & network labs', free: '—', standard: '—', premium: 'Yes' },
] as const;

export const PRICING_FAQ = [
  {
    q: 'How does the 3-month free trial work?',
    a: 'Every new account starts on the Free tier with 3 months of platform access. No credit card is required to sign up.',
  },
  {
    q: 'What happens after 3 months?',
    a: 'After your trial ends, subscribe to Standard or Premium to keep learning. Your existing courses stay in your account.',
  },
  {
    q: 'What is the difference between Standard and Premium?',
    a: 'Standard ($34/mo) includes 20 assessments, 20 courses, 50 quizzes/exams per month, and 50 practice sessions per day. Premium ($150/mo) removes those limits entirely.',
  },
  {
    q: 'Which features need Premium during the trial?',
    a: 'Premium-only features — unlimited assessments, courses, quizzes, exams, practice, priority generation, and advanced SOC/network labs — require a paid Premium subscription even while your trial is active.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Manage or cancel from the billing portal. Access continues until the end of your billing period.',
  },
] as const;

/** @deprecated Use FREE_PLAN_FEATURES — kept for upgrade page imports during transition */
export const FREE_PLAN_FEATURES_LEGACY = TRIAL_INCLUDED_FEATURES;
