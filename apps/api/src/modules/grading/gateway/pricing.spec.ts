import { costEurMicros, countTokens, estimateTokens } from './pricing';

describe('gateway pricing', () => {
  it('estimates at least one token', () => {
    expect(estimateTokens('')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcdefgh')).toBe(2);
  });

  it('prices tokens in EUR micros', () => {
    expect(costEurMicros(10, 4)).toBe(10 * 1 + 4 * 3);
  });

  it('counts real cl100k_base tokens for RAG gates', () => {
    expect(countTokens('')).toBe(0);
    expect(countTokens('hello world')).toBe(2);
    expect(
      countTokens('Backup tapes follow the same clock as the source system.'),
    ).toBe(11);
    // Non-Latin text costs more tokens per character than chars / 4 suggests.
    expect(countTokens('ব্যাকআপ টেপ')).toBeGreaterThan(
      estimateTokens('ব্যাকআপ টেপ'),
    );
  });
});
