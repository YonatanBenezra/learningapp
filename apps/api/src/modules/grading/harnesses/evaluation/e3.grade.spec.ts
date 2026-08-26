import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  E3_NEAR_MISS_PAYLOAD,
  E3_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeE3 } from './e3.grade';
import type { EvalItem } from './eval.types';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/eval-003-catch-the-regression/eval_hidden.json',
    ),
    'utf8',
  ),
) as EvalItem[];

describe('gradeE3', () => {
  it('passes the hebrew-billing slice spec', () => {
    const result = gradeE3(E3_REFERENCE_PAYLOAD.sliceSpecYaml, hidden);
    expect(result.verdict).toBe('pass');
    expect(result.metrics.gold_slice_flagged.value).toBe(1);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails an aggregate-only near-miss', () => {
    const result = gradeE3(E3_NEAR_MISS_PAYLOAD.sliceSpecYaml, hidden);
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('aggregate-only');
  });
});
