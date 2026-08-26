import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  R4_NEAR_MISS_PAYLOAD,
  R4_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from './chunking';
import { gradeR4 } from './r4.grade';
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
      'content/exercises/rag-004-rerank-or-rethink/eval_hidden.json',
    ),
    'utf8',
  ),
) as HiddenItem[];
const publicItems = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/rag-004-rerank-or-rethink/eval_public.json',
    ),
    'utf8',
  ),
) as HiddenItem[];

describe('gradeR4', () => {
  it('passes title-boost over the lexical baseline', async () => {
    const result = await gradeR4(
      R4_REFERENCE_PAYLOAD,
      docs,
      hidden,
      publicItems,
      undefined,
      'run-r4-ref',
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.ndcg_improvement.value).toBeGreaterThanOrEqual(0.15);
    expect(result.metrics.context_tokens.value).toBeLessThanOrEqual(3000);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails with no reranker', async () => {
    const result = await gradeR4(
      R4_NEAR_MISS_PAYLOAD,
      docs,
      hidden,
      publicItems,
      undefined,
      'run-r4-miss',
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('no-rerank');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
