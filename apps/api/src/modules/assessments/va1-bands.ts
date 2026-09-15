/** VA1 score bands — thresholds fixed before the first real sitting (Phase 3 Step 5). */

export const VA1_PROBLEMS_PER_SITTING = 4;
export const VA1_MAX_ITEM_SCORE = 100;

export const VA1_MAX_SITTING_SCORE =
  VA1_PROBLEMS_PER_SITTING * VA1_MAX_ITEM_SCORE;

/** Minimum total score (out of 400) for the Verified band. */
export const VA1_VERIFIED_MIN_SCORE = 320;

/** Minimum total score for the Developing band. */
export const VA1_DEVELOPING_MIN_SCORE = 200;

/** Minimum total score for the Foundation band. */
export const VA1_FOUNDATION_MIN_SCORE = 100;

export type Va1BandId = 'verified' | 'developing' | 'foundation' | 'not_ready';

export type Va1Band = {
  id: Va1BandId;
  label: string;
  minTotalScore: number;
};

export const VA1_BANDS: readonly Va1Band[] = [
  {
    id: 'verified',
    label: 'Verified',
    minTotalScore: VA1_VERIFIED_MIN_SCORE,
  },
  {
    id: 'developing',
    label: 'Developing',
    minTotalScore: VA1_DEVELOPING_MIN_SCORE,
  },
  {
    id: 'foundation',
    label: 'Foundation',
    minTotalScore: VA1_FOUNDATION_MIN_SCORE,
  },
  {
    id: 'not_ready',
    label: 'Not ready',
    minTotalScore: 0,
  },
] as const;

export function va1BandForTotalScore(totalScore: number): Va1Band {
  const score = Math.max(0, Math.round(totalScore));
  for (const band of VA1_BANDS) {
    if (score >= band.minTotalScore) {
      return band;
    }
  }
  return VA1_BANDS[VA1_BANDS.length - 1]!;
}
