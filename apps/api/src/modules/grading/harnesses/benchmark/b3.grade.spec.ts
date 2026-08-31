import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  B3_NEAR_MISS_PAYLOAD,
  B3_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeB3 } from './b3.grade';
import type { BenchmarkHidden } from './benchmark.types';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/bnch-003-eval-overlap/eval_hidden.json',
    ),
    'utf8',
  ),
) as BenchmarkHidden;

describe('gradeB3', () => {
  it('scores a tied clean slice and a contaminated overlap slice', () => {
    const usable = hidden.items.filter((item) => item.id !== 'canary');
    const clean = usable.filter((item) => item.slice === 'clean');
    const overlap = usable.filter((item) => item.slice === 'overlap');
    expect(usable).toHaveLength(40);
    expect(clean).toHaveLength(28);
    expect(overlap).toHaveLength(12);
    expect(usable.filter((item) => item.a === item.gold)).toHaveLength(24);
    expect(usable.filter((item) => item.b === item.gold)).toHaveLength(32);
    expect(clean.filter((item) => item.a === item.gold)).toHaveLength(20);
    expect(clean.filter((item) => item.b === item.gold)).toHaveLength(20);
    expect(overlap.filter((item) => item.a === item.gold)).toHaveLength(4);
    expect(overlap.filter((item) => item.b === item.gold)).toHaveLength(12);
  });

  it('passes a contamination call and shows slice intervals', () => {
    const result = gradeB3(B3_REFERENCE_PAYLOAD, hidden, [
      { question: 'A 24/40 vs B 32/40' },
    ]);
    expect(result.verdict).toBe('pass');
    expect(result.metrics.acc_clean_a.hits).toBe(20);
    expect(result.metrics.acc_clean_b.hits).toBe(20);
    expect(result.metrics.acc_overlap_a.hits).toBe(4);
    expect(result.metrics.acc_overlap_b.hits).toBe(12);
    expect(result.scorecard.wallClock).toBe('information');
    expect(typeof result.scorecard.message).toBe('string');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a near-miss that treats the leaky few-shot as a better model', () => {
    const result = gradeB3(B3_NEAR_MISS_PAYLOAD, hidden, []);
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toEqual(
      expect.arrayContaining(['ranking-win', 'wrong-cause']),
    );
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a canary echo without putting the canary in the scorecard', () => {
    const result = gradeB3(
      { ...B3_REFERENCE_PAYLOAD, note: 'HIDDEN_EVAL_B3_CANARY_PHRASE' },
      hidden,
      [],
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('canary-leak');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
