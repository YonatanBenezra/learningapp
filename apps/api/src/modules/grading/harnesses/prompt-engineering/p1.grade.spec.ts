import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  P1_NEAR_MISS_PAYLOAD,
  P1_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { PeItem } from './pe.types';
import { gradeP1 } from './p1.grade';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/pe-001-the-json-contract/eval_hidden.json',
    ),
    'utf8',
  ),
) as PeItem[];

describe('gradeP1', () => {
  it('passes the reference prompt contract', () => {
    const result = gradeP1(P1_REFERENCE_PAYLOAD, hidden);
    expect(result.verdict).toBe('pass');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(result.trace)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a vague near-miss', () => {
    const result = gradeP1(P1_NEAR_MISS_PAYLOAD, hidden);
    expect(result.verdict).toBe('fail');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
