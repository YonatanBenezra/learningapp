import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  B2_NEAR_MISS_PAYLOAD,
  B2_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { intervalsOverlap, wilsonInterval } from '../../metrics/wilson';
import { gradeB2 } from './b2.grade';
import type { BenchmarkHidden } from './benchmark.types';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/bnch-002-same-checkpoint-decode/eval_hidden.json',
    ),
    'utf8',
  ),
) as BenchmarkHidden;

describe('gradeB2', () => {
  it('scores decode traces with separated Wilson CIs', () => {
    const usable = hidden.items.filter((item) => item.id !== 'canary');
    const a = usable.filter((item) => item.a === item.gold).length;
    const b = usable.filter((item) => item.b === item.gold).length;
    expect(usable).toHaveLength(40);
    expect(a).toBe(34);
    expect(b).toBe(16);
    expect(intervalsOverlap(wilsonInterval(a, 40), wilsonInterval(b, 40))).toBe(
      false,
    );
  });

  it('passes a harness-only decode call and shows intervals', () => {
    const result = gradeB2(B2_REFERENCE_PAYLOAD, hidden, [
      { question: 'A 34/40 vs B 16/40' },
    ]);
    expect(result.verdict).toBe('pass');
    expect(result.metrics.ci_separated.value).toBe(1);
    expect(result.scorecard.ciOverlap).toBe(false);
    expect(result.scorecard.wallClock).toBe('information');
    expect(result.scorecard.decodeA).toBe('greedy');
    expect(typeof result.scorecard.message).toBe('string');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a near-miss that ranks greedy as a better model', () => {
    const result = gradeB2(B2_NEAR_MISS_PAYLOAD, hidden, []);
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toEqual(
      expect.arrayContaining(['ranking-win', 'wrong-cause']),
    );
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails the B1 trap of calling separated CIs noise', () => {
    const result = gradeB2(
      { rankingCall: 'noise', deltaCause: 'ci_overlap' },
      hidden,
      [],
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toEqual(
      expect.arrayContaining(['ranking-win', 'wrong-cause']),
    );
  });

  it('fails a canary echo without putting the canary in the scorecard', () => {
    const result = gradeB2(
      { ...B2_REFERENCE_PAYLOAD, note: 'HIDDEN_EVAL_B2_CANARY_PHRASE' },
      hidden,
      [],
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('canary-leak');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
