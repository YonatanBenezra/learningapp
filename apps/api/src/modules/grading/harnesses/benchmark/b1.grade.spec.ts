import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  B1_NEAR_MISS_PAYLOAD,
  B1_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { intervalsOverlap, wilsonInterval } from '../../metrics/wilson';
import { gradeB1 } from './b1.grade';
import type { BenchmarkHidden } from './benchmark.types';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/bnch-001-two-harnesses-one-score/eval_hidden.json',
    ),
    'utf8',
  ),
) as BenchmarkHidden;

describe('gradeB1', () => {
  it('scores frozen harness traces with overlapping Wilson CIs', () => {
    const usable = hidden.items.filter((item) => item.id !== 'canary');
    const a = usable.filter((item) => item.a === item.gold).length;
    const b = usable.filter((item) => item.b === item.gold).length;
    expect(usable).toHaveLength(40);
    expect(a).toBe(28);
    expect(b).toBe(31);
    expect(intervalsOverlap(wilsonInterval(a, 40), wilsonInterval(b, 40))).toBe(
      true,
    );
  });

  it('passes a noise call and keeps the canary out of the grade', () => {
    const result = gradeB1(B1_REFERENCE_PAYLOAD, hidden, [
      { question: 'A 28/40 vs B 31/40' },
    ]);
    expect(result.verdict).toBe('pass');
    expect(result.metrics.ranking_noise.value).toBe(1);
    expect(result.metrics.ci_overlap.value).toBe(1);
    expect(result.scorecard.wallClock).toBe('information');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(result.trace)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a near-miss that treats the headline delta as a ranking win', () => {
    const result = gradeB1(B1_NEAR_MISS_PAYLOAD, hidden, []);
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('ranking-win');
    expect(result.failureClasses).toContain('wrong-cause');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a canary echo without putting the canary in the scorecard', () => {
    const result = gradeB1(
      { ...B1_REFERENCE_PAYLOAD, note: 'HIDDEN_EVAL_B1_CANARY_PHRASE' },
      hidden,
      [],
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('canary-leak');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
