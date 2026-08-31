import { computeStreak } from './streak';

describe('computeStreak', () => {
  it('starts at zero with no passes', () => {
    expect(computeStreak([], '2026-09-10')).toEqual({
      current: 0,
      longest: 0,
      lastQualifiedDate: null,
    });
  });

  it('increments on consecutive pass days including today', () => {
    expect(
      computeStreak(['2026-09-08', '2026-09-09', '2026-09-10'], '2026-09-10'),
    ).toEqual({
      current: 3,
      longest: 3,
      lastQualifiedDate: '2026-09-10',
    });
  });

  it('keeps yesterday’s streak alive until local midnight', () => {
    expect(computeStreak(['2026-09-08', '2026-09-09'], '2026-09-10')).toEqual({
      current: 2,
      longest: 2,
      lastQualifiedDate: '2026-09-09',
    });
  });

  it('resets when a day is missed', () => {
    expect(
      computeStreak(['2026-09-06', '2026-09-07', '2026-09-10'], '2026-09-10'),
    ).toEqual({
      current: 1,
      longest: 2,
      lastQualifiedDate: '2026-09-10',
    });
  });

  it('is zero when the last pass is older than yesterday', () => {
    expect(computeStreak(['2026-09-07'], '2026-09-10')).toEqual({
      current: 0,
      longest: 1,
      lastQualifiedDate: '2026-09-07',
    });
  });

  it('dedupes multiple passes on the same calendar day', () => {
    expect(
      computeStreak(['2026-09-10', '2026-09-10', '2026-09-09'], '2026-09-10'),
    ).toEqual({
      current: 2,
      longest: 2,
      lastQualifiedDate: '2026-09-10',
    });
  });
});
