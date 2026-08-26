import { costEurMicros, estimateTokens } from './pricing';

describe('gateway pricing', () => {
  it('estimates at least one token', () => {
    expect(estimateTokens('')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcdefgh')).toBe(2);
  });

  it('prices tokens in EUR micros', () => {
    expect(costEurMicros(10, 4)).toBe(10 * 1 + 4 * 3);
  });
});
