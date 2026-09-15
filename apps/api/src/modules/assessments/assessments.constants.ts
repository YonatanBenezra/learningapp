/** VA1 blueprint — [phase-3-decisions.md](../../../../docs/phase-3-decisions.md) */
export const ASSESSMENT_TIME_BOX_MINUTES = 90;
export const ASSESSMENT_SAMPLE_SIZE = 4;
export const ASSESSMENT_SITTINGS_PER_SEASON = 1;
export const ASSESSMENT_PRO_ONLY = true;
export const ASSESSMENT_HINTS_OFF = true;
export const ASSESSMENT_COUNTS_TOWARD_FAIR_USE = false;

export const ASSESSMENT_SEASON_USED = {
  message: 'You already used your verified assessment sitting for this season.',
  code: 'assessment_season_used',
} as const;

export const VA1_ASSESSMENT_SLUG = 'va1-q3-2026';

export const ASSESSMENT_PRO_REQUIRED = {
  message: 'Upgrade to Pro to sit a verified assessment.',
  code: 'pro_required',
  upgradePath: '/billing',
} as const;

export const ASSESSMENT_TRACE_WITHHELD =
  'Trace is available after the sitting closes.';
