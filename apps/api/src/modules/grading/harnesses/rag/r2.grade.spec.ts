import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  R2_NEAR_MISS_PAYLOAD,
  R2_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from './chunking';
import { countTokens } from '../../gateway/pricing';
import { chunkForR2, gradeR2, retrieveForR2 } from './r2.grade';
import { bm25Retriever } from './retrievers';
import type { HiddenItem } from './rag.types';

const docs = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'content/corpora/internal-policy.json'),
    'utf8',
  ),
) as CorpusDoc[];
const hidden = JSON.parse(
  readFileSync(
    path.join(__dirname, '../__fixtures__/internal-policy/r2.eval_hidden.json'),
    'utf8',
  ),
) as HiddenItem[];
const publicItems = JSON.parse(
  readFileSync(
    path.join(__dirname, '../__fixtures__/internal-policy/r2.eval_public.json'),
    'utf8',
  ),
) as HiddenItem[];

const gates = JSON.parse(
  readFileSync(
    path.join(__dirname, '../__fixtures__/internal-policy/r2.gates.json'),
    'utf8',
  ),
) as { metric: string; value: number }[];
const tokenCeiling = gates.find(
  (gate) => gate.metric === 'mean_prompt_tokens',
)!.value;
const recallTarget = gates.find((gate) => gate.metric === 'recall@k')!.value;

describe('gradeR2', () => {
  it('passes the reference config', async () => {
    const result = await gradeR2(
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

  it('fails the high-k near-miss on cost', async () => {
    const result = await gradeR2(
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
    expect(result.failureClasses).toContain('context-over-budget');
    // The scorecard shows where the budget went: chunks per query x size.
    const breakdown = result.scorecard.breakdown as {
      cost: { meanTokens: number; meanChunks: number; ceiling: number };
    };
    expect(breakdown.cost.meanTokens).toBeGreaterThan(breakdown.cost.ceiling);
    expect(breakdown.cost.meanChunks).toBe(R2_NEAR_MISS_PAYLOAD.topK);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('chunks by chunkSize instead of one chunk per document', () => {
    const small = chunkForR2(docs, { topK: 5, rerank: false, chunkSize: 50 });
    const large = chunkForR2(docs, { topK: 5, rerank: false, chunkSize: 2000 });
    expect(small.length).toBeGreaterThan(large.length);
    expect(large).toHaveLength(docs.length);
  });

  it('counts tokens on the full retrieved chunks that recall is judged on', async () => {
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
          countTokens(
            `Context:\n${retrieveForR2(
              item.question,
              bm25Retriever(chunks),
              payload,
            )
              .map((row) => row.chunk.text)
              .join('\n\n')}`,
          ),
        )
        .reduce((sum, value) => sum + value, 0) / answerable.length;
    const result = await gradeR2(payload, docs, hidden, publicItems, gates);
    expect(result.metrics.mean_prompt_tokens.value).toBeCloseTo(expected, 6);
  });

  it('closes the retrieve-everything exploit with the token gate', async () => {
    const result = await gradeR2(
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

  it('marks gold only on public trace queries, never on hidden failing samples', async () => {
    const publicWithGold = [
      {
        question: 'Who approves PTO before the leave starts?',
        goldDocId: 'pto',
        goldSpan: 'Managers approve PTO in Workday',
      },
    ];
    const result = await gradeR2(
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

  it('grades with dense or hybrid retrieval when the payload asks for it', async () => {
    for (const retrievalMode of ['dense', 'hybrid'] as const) {
      const result = await gradeR2(
        { ...R2_REFERENCE_PAYLOAD, retrievalMode, hybridAlpha: 0.5 },
        docs,
        hidden,
        publicItems,
        gates,
      );
      expect(result.scorecard.retrieval).toMatch(
        retrievalMode === 'dense' ? /^Dense/ : /^Hybrid \(alpha 0\.50\)/,
      );
      expect(result.metrics.recall_at_k.value).toBeGreaterThan(0.8);
    }
  }, 180_000);
});
