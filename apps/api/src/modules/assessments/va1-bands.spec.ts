import {
  VA1_MAX_SITTING_SCORE,
  VA1_VERIFIED_MIN_SCORE,
  va1BandForTotalScore,
} from './va1-bands';

describe('va1BandForTotalScore', () => {
  it('uses thresholds fixed before the first real sitting', () => {
    expect(VA1_MAX_SITTING_SCORE).toBe(400);
    expect(VA1_VERIFIED_MIN_SCORE).toBe(320);
  });

  it('places a perfect reference sitting in Verified', () => {
    expect(va1BandForTotalScore(400).id).toBe('verified');
    expect(va1BandForTotalScore(VA1_VERIFIED_MIN_SCORE).id).toBe('verified');
  });

  it('places a near-miss sitting below the Verified boundary', () => {
    expect(va1BandForTotalScore(VA1_VERIFIED_MIN_SCORE - 1).id).toBe(
      'developing',
    );
    expect(va1BandForTotalScore(300).id).toBe('developing');
    expect(va1BandForTotalScore(0).id).toBe('not_ready');
  });
});
