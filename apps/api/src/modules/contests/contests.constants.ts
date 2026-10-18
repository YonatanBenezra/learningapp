/** Primary timed contest slug (see `content/contests/weekly-advanced-1.json`). */
export const DOGFOOD_CONTEST = 'weekly-advanced-1';

/** Live timed contests in `content/contests/*.json` (excluding assessments). */
export const LIVE_CONTEST_COUNT = 1;

export const CONTESTS_LIVE = LIVE_CONTEST_COUNT > 0;

export const CONTEST_POOL = ['weekly-advanced-1'] as const;
