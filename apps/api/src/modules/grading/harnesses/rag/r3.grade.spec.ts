import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  R3_NEAR_MISS_PAYLOAD,
  R3_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { ModelGateway } from '../../gateway/model.gateway';
import type { CorpusDoc } from './chunking';
import { gradeR3 } from './r3.grade';
import type { HiddenItem } from './rag.types';

const docs = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'content/corpora/internal-policy.json'),
    'utf8',
  ),
) as CorpusDoc[];
const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/rag-003-the-citation-contract/eval_hidden.json',
    ),
    'utf8',
  ),
) as HiddenItem[];
const publicItems = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/rag-003-the-citation-contract/eval_public.json',
    ),
    'utf8',
  ),
) as HiddenItem[];

function fakeGateway(): ModelGateway {
  return {
    complete: async (input: { prompt: string }) => ({
      text: `FAKE:deadbeef:${input.prompt.length}`,
      modelVersion: 'labpath-fake-v1',
      tokensIn: 1,
      tokensOut: 1,
      costEurMicros: 4,
      cacheHit: false,
    }),
  } as ModelGateway;
}

describe('gradeR3', () => {
  it('passes the citation+refusal prompt', async () => {
    const result = await gradeR3(
      R3_REFERENCE_PAYLOAD,
      docs,
      hidden,
      publicItems,
      fakeGateway(),
      'run-r3-ref',
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.gold_span_overlap.value).toBeGreaterThanOrEqual(0.85);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a helpful-only near-miss', async () => {
    const result = await gradeR3(
      R3_NEAR_MISS_PAYLOAD,
      docs,
      hidden,
      publicItems,
      fakeGateway(),
      'run-r3-miss',
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
