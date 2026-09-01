import { sortContestRows } from './contest-rank';

describe('sortContestRows', () => {
  it('ranks by score then elapsed time', () => {
    const ranked = sortContestRows([
      { slug: 'b', totalScore: 150, elapsedMs: 1000 },
      { slug: 'a', totalScore: 180, elapsedMs: 5000 },
      { slug: 'c', totalScore: 150, elapsedMs: 500 },
    ]);
    expect(ranked.map((row) => row.slug)).toEqual(['a', 'c', 'b']);
  });
});
