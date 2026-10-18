import { leaderboardToCsv } from './contest-leaderboard-csv';

describe('leaderboardToCsv', () => {
  it('escapes display names and includes header', () => {
    const csv = leaderboardToCsv('weekly-advanced-1', [
      {
        rank: 1,
        displayName: 'Ada, "pro"',
        totalScore: 900,
        elapsedMs: 1200,
        solvedCount: 9,
        totalCount: 15,
        status: 'finished',
      },
    ]);
    expect(csv).toContain('displayName');
    expect(csv).toContain('"Ada, ""pro"""');
  });
});
