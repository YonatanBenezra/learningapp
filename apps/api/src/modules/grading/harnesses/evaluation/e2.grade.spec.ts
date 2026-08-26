import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  E2_NEAR_MISS_PAYLOAD,
  E2_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { ModelGateway } from '../../gateway/model.gateway';
import { gradeE2 } from './e2.grade';
import type { EvalItem } from './eval.types';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/eval-002-judge-the-judge/eval_hidden.json',
    ),
    'utf8',
  ),
) as EvalItem[];

function fakeGateway(): ModelGateway {
  return {
    judge: async () => ({
      text: 'FAKE_JUDGE:deadbeef',
      modelVersion: 'labpath-fake-judge-v1',
      tokensIn: 1,
      tokensOut: 1,
      costEurMicros: 4,
      cacheHit: false,
    }),
  } as ModelGateway;
}

describe('gradeE2', () => {
  it('passes the strict rubric', async () => {
    const result = await gradeE2(
      E2_REFERENCE_PAYLOAD,
      hidden,
      [],
      fakeGateway(),
      'run-e2-ref',
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.cohen_kappa.value).toBeGreaterThanOrEqual(0.6);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a generous near-miss', async () => {
    const result = await gradeE2(
      E2_NEAR_MISS_PAYLOAD,
      hidden,
      [],
      fakeGateway(),
      'run-e2-miss',
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses.length).toBeGreaterThan(0);
  });
});
