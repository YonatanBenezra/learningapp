import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  R2_NEAR_MISS_PAYLOAD,
  R2_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from './chunking';
import { estimateTokens } from '../../gateway/pricing';
import { chunkForR2, gradeR2, retrieveForR2 } from './r2.grade';
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

const gates = (
  JSON.parse(
    readFileSync(
      path.join(
        process.cwd(),
        'content/exercises/rag-002-the-cost-ceiling/meta.json',
      ),
      'utf8',
    ),
  ) as { gates: { metric: string; value: number }[] }
).gates;
const tokenCeiling = gates.find(
  (gate) => gate.metric === 'mean_prompt_tokens',
)!.value;
const recallTarget = gates.find((gate) => gate.metric === 'recall@k')!.value;

describe('gradeR2', () => {
  it('passes the reference config', () => {
    const result = gradeR2(
      R2_REFERENCE_PAYLOAD,
      docs,
      hidden,
      publicItems,
      gates,
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.recall_at_k.value).toBeGreaterThanOrEqual(
      recallTarget,
    );
    expect(result.metrics.mean_prompt_tokens.value).toBeLessThanOrEqual(
      tokenCeiling,
    );
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails the high-k near-miss on cost', () => {
    const result = gradeR2(
      R2_NEAR_MISS_PAYLOAD,
      docs,
      hidden,
      publicItems,
      gates,
    );
    expect(result.verdict).toBe('fail');
    expect(result.metrics.mean_prompt_tokens.value).toBeGreaterThan(
      tokenCeiling,
    );
    expect(result.failureClasses).toContain('topk-too-high');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('chunks by chunkSize instead of one chunk per document', () => {
    const small = chunkForR2(docs, { topK: 5, rerank: false, chunkSize: 50 });
    const large = chunkForR2(docs, { topK: 5, rerank: false, chunkSize: 2000 });
    expect(small.length).toBeGreaterThan(large.length);
    expect(large).toHaveLength(docs.length);
  });

  it('counts tokens on the full retrieved chunks that recall is judged on', () => {
    const payload = { topK: 3, rerank: true, chunkSize: 50 };
    const chunks = chunkForR2(docs, payload);
    const answerable = hidden.filter(
      (item) =>
        item.answerable &&
        item.goldSpan &&
        item.goldDocId &&
        !item.question.includes('HIDDEN_EVAL'),
    );
    const expected =
      answerable
        .map((item) =>
          estimateTokens(
            `Context:\n${retrieveForR2(item.question, chunks, payload)
              .map((row) => row.chunk.text)
              .join('\n\n')}`,
          ),
        )
        .reduce((sum, value) => sum + value, 0) / answerable.length;
    const result = gradeR2(payload, docs, hidden, publicItems, gates);
    expect(result.metrics.mean_prompt_tokens.value).toBeCloseTo(expected, 6);
  });

  it('closes the retrieve-everything exploit with the token gate', () => {
    const result = gradeR2(
      { topK: 40, rerank: false, chunkSize: 50 },
      docs,
      hidden,
      publicItems,
      gates,
    );
    expect(result.verdict).toBe('fail');
    expect(result.metrics.mean_prompt_tokens.value).toBeGreaterThan(
      tokenCeiling,
    );
  });

  it('marks gold only on public trace queries, never on hidden failing samples', () => {
    const publicWithGold = [
      {
        question: 'Who approves PTO before the leave starts?',
        goldDocId: 'pto',
        goldSpan: 'Managers approve PTO in Workday',
      },
    ];
    const result = gradeR2(
      { topK: 1, rerank: true, chunkSize: 50 },
      docs,
      hidden,
      publicWithGold,
      gates,
    );
    const publicQuery = result.trace.queries.find(
      (row) => row.source === 'public',
    );
    expect(typeof publicQuery?.hit).toBe('boolean');
    expect(publicQuery?.retrieved[0].firstStageRank).toBeGreaterThan(0);
    expect(publicQuery?.contextTokens).toBeGreaterThan(0);
    for (const row of result.trace.queries.filter(
      (query) => query.source === 'failing_sample',
    )) {
      expect(row.hit).toBeUndefined();
      expect(row.retrieved.every((hit) => hit.goldHit === undefined)).toBe(
        true,
      );
    }
  });
});
