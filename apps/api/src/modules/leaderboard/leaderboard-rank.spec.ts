import {
  hintCost,
  hintPointsSpent,
  leaderboardRating,
  sortLeaderboardRows,
} from './leaderboard-rank';

describe('leaderboard rank', () => {
  it('returns an empty board when nobody is eligible', () => {
    expect(sortLeaderboardRows([])).toEqual([]);
  });

  it('ranks unique solves first, then recent passes, then slug', () => {
    const ranked = sortLeaderboardRows([
      { slug: 'zoe', solves: 1, recentPasses: 4 },
      { slug: 'ada', solves: 3, recentPasses: 1 },
      { slug: 'bea', solves: 3, recentPasses: 2 },
    ]);
    expect(ranked.map((row) => row.slug)).toEqual(['bea', 'ada', 'zoe']);
    expect(leaderboardRating(3, 2)).toBe(302);
  });

  it('charges hints only on solved problems, rising per hint and capped', () => {
    expect([0, 1, 2, 3].map(hintCost)).toEqual([0, 5, 10, 15]);
    const unlocks = [0, 1, 2, 3, 4, 5].map((hintIndex) => ({
      slug: 'rag-001',
      hintIndex,
    }));
    // 0 + 5 + 10 + 15 + 20 + 25 = 75, capped at 50.
    expect(hintPointsSpent(unlocks, new Set(['rag-001']))).toBe(50);
    expect(hintPointsSpent(unlocks, new Set())).toBe(0);
    expect(
      hintPointsSpent(
        [
          { slug: 'a', hintIndex: 0 },
          { slug: 'a', hintIndex: 1 },
          { slug: 'b', hintIndex: 0 },
        ],
        new Set(['a', 'b']),
      ),
    ).toBe(5);
  });

  it('ranks by rating, so hints can cost a place', () => {
    const ranked = sortLeaderboardRows([
      { slug: 'ada', solves: 3, recentPasses: 1, hintPoints: 30 },
      { slug: 'bea', solves: 3, recentPasses: 0, hintPoints: 0 },
    ]);
    expect(ranked.map((row) => row.slug)).toEqual(['bea', 'ada']);
    expect(leaderboardRating(3, 1, 30)).toBe(271);
  });
});
