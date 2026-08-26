import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  E1_NEAR_MISS_PAYLOAD,
  E1_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeE1 } from './e1.grade';
import type { EvalItem } from './eval.types';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/eval-001-write-the-assertion-suite/eval_hidden.json',
    ),
    'utf8',
  ),
) as EvalItem[];

describe('gradeE1', () => {
  it('passes the reference suite', () => {
    const result = gradeE1(E1_REFERENCE_PAYLOAD.suiteYaml, hidden);
    expect(result.verdict).toBe('pass');
    expect(result.metrics.f1.value).toBeGreaterThanOrEqual(0.7);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a narrow near-miss and rejects a degenerate suite', () => {
    const miss = gradeE1(E1_NEAR_MISS_PAYLOAD.suiteYaml, hidden);
    expect(miss.verdict).toBe('fail');
    const degenerate = gradeE1(
      'version: 1\nassertions: []\nverdict:\n  fail_if: any\n',
      hidden,
    );
    expect(degenerate.failureClasses).toContain('degenerate-suite');
  });
});
