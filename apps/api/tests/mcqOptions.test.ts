import { describe, it, expect } from 'vitest';
import { shuffleMcqOptions, resolveCorrectOption } from '../src/modules/assessments/mcqOptions';

describe('mcqOptions', () => {
  it('resolves correct answer case-insensitively', () => {
    expect(resolveCorrectOption(['Paris', 'London'], 'paris')).toBe('Paris');
  });

  it('throws when correct answer does not match any option', () => {
    expect(() => resolveCorrectOption(['A', 'B'], 'C')).toThrow(/does not match/);
  });

  it('shuffles options while preserving the correct answer reference', () => {
    const options = ['Short', 'Medium length', 'Longest option text here', 'Tiny'];
    let sawDifferentOrder = false;
    for (let i = 0; i < 20; i += 1) {
      const { options: shuffled, correctAnswer } = shuffleMcqOptions(
        options,
        'Longest option text here',
        () => 0.1,
      );
      expect(shuffled).toHaveLength(4);
      expect(shuffled).toContain('Longest option text here');
      expect(correctAnswer).toBe('Longest option text here');
      if (shuffled[0] !== 'Short') sawDifferentOrder = true;
    }
    expect(sawDifferentOrder).toBe(true);
  });
});
