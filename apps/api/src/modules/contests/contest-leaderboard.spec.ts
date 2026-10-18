import {
  assignRanks,
  compareLeaderboardRows,
  countGradedSlugs,
} from './contest-leaderboard';

describe('contest leaderboard', () => {
  const t0 = new Date('2026-01-01T12:00:00.000Z');

  it('orders by score then elapsed', () => {
    expect(
      compareLeaderboardRows(
        { totalScore: 100, elapsedMs: 5000, startedAt: t0 },
        { totalScore: 200, elapsedMs: 9000, startedAt: t0 },
      ),
    ).toBeGreaterThan(0);
    expect(
      compareLeaderboardRows(
        { totalScore: 200, elapsedMs: 5000, startedAt: t0 },
        { totalScore: 200, elapsedMs: 9000, startedAt: t0 },
      ),
    ).toBeLessThan(0);
  });

  it('assigns ranks', () => {
    const ranked = assignRanks([
      { totalScore: 50, elapsedMs: 100, startedAt: t0 },
      { totalScore: 100, elapsedMs: 200, startedAt: t0 },
    ]);
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[0]?.totalScore).toBe(100);
    expect(ranked[1]?.rank).toBe(2);
  });

  it('counts graded slugs in sample', () => {
    const n = countGradedSlugs(
      ['a', 'b', 'c'],
      [
        {
          exercise: { slug: 'a' },
          submissions: [{ runs: [{ grade: { verdict: 'pass' } }] }],
        },
        {
          exercise: { slug: 'b' },
          submissions: [{ runs: [{ grade: null }] }],
        },
      ],
    );
    expect(n).toBe(1);
  });
});
