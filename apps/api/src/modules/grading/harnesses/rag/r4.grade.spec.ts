import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  R4_NEAR_MISS_PAYLOAD,
  R4_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from './chunking';
import { cleanRewrite, gradeR4 } from './r4.grade';
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
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.ndcg_improvement.value).toBeGreaterThanOrEqual(0.15);
    expect(result.metrics.context_tokens.value).toBeLessThanOrEqual(2200);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails with no reranker', async () => {
    const result = await gradeR4(
      R4_NEAR_MISS_PAYLOAD,
      docs,
      hidden,
      publicItems,
      undefined,
    );
    expect(result.verdict).toBe('fail');
    // Evidence, not a config guess: with no reranker the first stage ranked
    // the gold doc below k, and the gain stayed under target.
    expect(result.failureClasses).toContain('gold-ranked-below-k');
    expect(result.failureClasses).toContain('ndcg-gain-below-target');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('searches with the rewritten query, so a good rewrite lifts nDCG', async () => {
    const titleOf = new Map(docs.map((doc) => [doc.id, doc.title]));
    const goldTitle = new Map(
      [...hidden, ...publicItems].map((item) => [
        item.question,
        titleOf.get(item.goldDocId ?? '') ?? item.question,
      ]),
    );
    const seen: [string, string][] = [];
    const payload = {
      reranker: 'none' as const,
      rerankTopN: 20,
      queryRewritePrompt: 'Name the policy this question is about.',
    };
    const result = await gradeR4(
      payload,
      docs,
      hidden,
      publicItems,
      (instruction, question) => {
        seen.push([instruction, question]);
        // A rewrite that names the right policy, three times over.
        const title = goldTitle.get(question) ?? question;
        return Promise.resolve(`Query: "${title} ${title} ${title}"`);
      },
    );
    expect(
      seen.every(([instruction]) => instruction === payload.queryRewritePrompt),
    ).toBe(true);
    expect(result.metrics.model_calls_per_question.value).toBe(1);
    expect(result.metrics.ndcg_improvement.value).toBeGreaterThan(0.2);
    const publicQuery = result.trace.queries.find(
      (row) => row.source === 'public',
    );
    expect(publicQuery?.rewrittenQuery).toMatch(/^\S/);
  });

  it('needs a model when a rewrite prompt is set', async () => {
    await expect(
      gradeR4(
        { reranker: 'none', rerankTopN: 20, queryRewritePrompt: 'Rewrite.' },
        docs,
        hidden,
        publicItems,
        undefined,
      ),
    ).rejects.toThrow(/needs a model/);
  });

  it('runs the cross-encoder reranker', async () => {
    const result = await gradeR4(
      { reranker: 'cross-encoder', rerankTopN: 20, queryRewritePrompt: '' },
      docs,
      hidden,
      publicItems,
      undefined,
    );
    expect(result.metrics.ndcg_improvement.value).toBeGreaterThan(0.3);
  }, 180_000);
});

describe('cleanRewrite', () => {
  it('keeps the first line, minus labels and quotes', () => {
    expect(
      cleanRewrite('Search query: "laptop refresh"\nbecause...', 'q'),
    ).toBe('laptop refresh');
  });

  it('falls back to the question when the model returns nothing usable', () => {
    expect(cleanRewrite('  \n ""', 'How long is PTO?')).toBe(
      'How long is PTO?',
    );
  });
});
