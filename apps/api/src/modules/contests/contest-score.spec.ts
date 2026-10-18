import { itemScoreFromGrade, scaleItemScore } from './contest-score';

describe('contest-score', () => {
  it('scales item scores to pointsPerProblem', () => {
    expect(scaleItemScore(100, 100)).toBe(100);
    expect(scaleItemScore(50, 100)).toBe(50);
    expect(scaleItemScore(100, 50)).toBe(50);
  });

  it('maps pass verdict to full points', () => {
    expect(
      itemScoreFromGrade({ verdict: 'pass', metrics: null }, 100),
    ).toBe(100);
    expect(
      itemScoreFromGrade({ verdict: 'pass', metrics: null }, 150),
    ).toBe(150);
  });
});
