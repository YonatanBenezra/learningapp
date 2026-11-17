import { readFileSync } from 'node:fs';
import path from 'node:path';
import { countTokens } from '../../gateway/pricing';
import type { CorpusDoc } from './chunking';
import {
  estimateRagLabWithCorpus,
  previewRagLabWithCorpus,
} from './rag-lab.engine';

const docs = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'content/corpora/internal-policy.json'),
    'utf8',
  ),
) as CorpusDoc[];

const SLUG = 'rag-017-rerank-pass';
const QUESTION =
  'How many days of paid time off do staff receive each calendar year?';
const PUBLIC_GOLD = {
  goldDocId: 'pto',
  goldSpan: 'twenty-two (22) days of paid time off',
};
const PAYLOAD = { topK: 2, rerank: true, chunkSize: 200 };

describe('previewRagLabWithCorpus', () => {
  it('marks the chunk that carries a public question gold sentence', async () => {
    const preview = await previewRagLabWithCorpus(
      SLUG,
      PAYLOAD,
      QUESTION,
      docs,
      PUBLIC_GOLD,
    );
    expect(preview.answerFound).toBe(true);
    expect(preview.retrieved.some((hit) => hit.containsAnswer)).toBe(true);
  });

  it('has no answer key for custom queries', async () => {
    const preview = await previewRagLabWithCorpus(
      SLUG,
      PAYLOAD,
      'office dogs',
      docs,
    );
    expect(preview.answerFound).toBeNull();
    expect(preview.retrieved.every((hit) => hit.containsAnswer === null)).toBe(
      true,
    );
  });

  it('reports R2 tokens exactly as the grader counts one question', async () => {
    const preview = await previewRagLabWithCorpus(
      SLUG,
      PAYLOAD,
      QUESTION,
      docs,
    );
    const joined = preview.retrieved.map((hit) => hit.text).join('\n\n');
    expect(preview.contextTokens).toBe(countTokens(`Context:\n${joined}`));
  });
});

describe('estimateRagLabWithCorpus', () => {
  it('runs every public question and counts answers that reach the context', async () => {
    const estimate = await estimateRagLabWithCorpus(
      SLUG,
      PAYLOAD,
      [
        { id: 'p1', question: QUESTION, answerable: true, gold: PUBLIC_GOLD },
        { id: 'p2', question: 'office dogs', answerable: false, gold: null },
      ],
      docs,
    );
    expect(estimate.questions).toBe(2);
    expect(estimate.answerable).toBe(1);
    expect(estimate.answersFound).toBe(1);
    expect(estimate.rows[0].goldRank).toBe(1);
    expect(estimate.rows[1].answerFound).toBeNull();
    expect(estimate.meanContextTokens).toBeGreaterThan(0);
  });
});

describe('R4 lab preview', () => {
  const R4 = 'rag-004-rerank-or-rethink';
  const payload = {
    reranker: 'title-boost',
    rerankTopN: 20,
    queryRewritePrompt: 'Rewrite the question as search keywords.',
  };

  it('skips the rewrite unless asked, and says so', async () => {
    const preview = await previewRagLabWithCorpus(R4, payload, QUESTION, docs);
    expect(preview.rewriteSkipped).toBe(true);
    expect(preview.rewrittenQuery).toBeNull();
  });

  it('searches with the rewrite when a rewriter is given', async () => {
    const preview = await previewRagLabWithCorpus(
      R4,
      payload,
      QUESTION,
      docs,
      null,
      null,
      () => Promise.resolve('paid time off days'),
    );
    expect(preview.rewriteSkipped).toBe(false);
    expect(preview.rewrittenQuery).toBe('paid time off days');
  });

  it('reports each chunk with its exact token count', async () => {
    const preview = await previewRagLabWithCorpus(
      SLUG,
      PAYLOAD,
      QUESTION,
      docs,
    );
    for (const chunk of preview.chunks.slice(0, 5)) {
      expect(chunk.tokens).toBe(countTokens(chunk.text));
    }
  });
});
