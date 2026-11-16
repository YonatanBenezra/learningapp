import { readFileSync } from 'node:fs';
import path from 'node:path';
import { estimateTokens } from '../../gateway/pricing';
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
  it('marks the chunk that carries a public question gold sentence', () => {
    const preview = previewRagLabWithCorpus(
      SLUG,
      PAYLOAD,
      QUESTION,
      docs,
      PUBLIC_GOLD,
    );
    expect(preview.answerFound).toBe(true);
    expect(preview.retrieved.some((hit) => hit.containsAnswer)).toBe(true);
  });

  it('has no answer key for custom queries', () => {
    const preview = previewRagLabWithCorpus(SLUG, PAYLOAD, 'office dogs', docs);
    expect(preview.answerFound).toBeNull();
    expect(preview.retrieved.every((hit) => hit.containsAnswer === null)).toBe(
      true,
    );
  });

  it('reports R2 tokens exactly as the grader counts one question', () => {
    const preview = previewRagLabWithCorpus(SLUG, PAYLOAD, QUESTION, docs);
    const joined = preview.retrieved.map((hit) => hit.text).join('\n\n');
    expect(preview.contextTokens).toBe(estimateTokens(`Context:\n${joined}`));
  });
});

describe('estimateRagLabWithCorpus', () => {
  it('runs every public question and counts answers that reach the context', () => {
    const estimate = estimateRagLabWithCorpus(
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
