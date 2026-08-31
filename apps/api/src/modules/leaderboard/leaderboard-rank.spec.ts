import {
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
});
