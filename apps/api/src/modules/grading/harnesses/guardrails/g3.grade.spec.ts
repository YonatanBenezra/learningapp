import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  G3_NEAR_MISS_PAYLOAD,
  G3_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeG3 } from './g3.grade';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/grd-003-hold-the-line/eval_hidden.json',
    ),
    'utf8',
  ),
) as unknown;

describe('gradeG3', () => {
  it('passes the reference defence', () => {
    const result = gradeG3(G3_REFERENCE_PAYLOAD, hidden, [], 'g3-ref');
    expect(result.verdict).toBe('pass');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a brittle keyword filter with no output checks', () => {
    const result = gradeG3(G3_NEAR_MISS_PAYLOAD, hidden, [], 'g3-miss');
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses.length).toBeGreaterThan(0);
  });
});
