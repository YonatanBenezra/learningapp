import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  R2_NEAR_MISS_PAYLOAD,
  R2_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from './chunking';
import { gradeR2 } from './r2.grade';
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
      'content/exercises/rag-002-the-cost-ceiling/eval_hidden.json',
    ),
    'utf8',
  ),
) as HiddenItem[];
const publicItems = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/rag-002-the-cost-ceiling/eval_public.json',
    ),
    'utf8',
  ),
) as HiddenItem[];

describe('gradeR2', () => {
  it('passes the reference config', () => {
    const result = gradeR2(R2_REFERENCE_PAYLOAD, docs, hidden, publicItems);
    expect(result.verdict).toBe('pass');
    expect(result.metrics.recall_at_k.value).toBeGreaterThanOrEqual(0.8);
    expect(result.metrics.mean_prompt_tokens.value).toBeLessThanOrEqual(2000);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails the high-k near-miss on cost', () => {
    const result = gradeR2(R2_NEAR_MISS_PAYLOAD, docs, hidden, publicItems);
    expect(result.verdict).toBe('fail');
    expect(result.metrics.mean_prompt_tokens.value).toBeGreaterThan(2000);
    expect(result.failureClasses).toContain('topk-too-high');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
