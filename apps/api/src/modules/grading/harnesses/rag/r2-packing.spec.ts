import type { CorpusDoc } from './chunking';
import { gradeR2 } from './r2.grade';
import type { HiddenItem } from './rag.types';

const index = (team: string): CorpusDoc => ({
  id: `index-${team}`,
  title: `Deploy handbook index (${team})`,
  text: `Linked pages explain whether you can deploy to production on a Friday afternoon. Copied by ${team}.`,
});
const docs: CorpusDoc[] = [
  index('payments'),
  index('search'),
  index('mobile'),
  {
    id: 'freeze',
    title: 'Release freeze calendar',
    text: 'No production deploys go out after 15:00 on Fridays.',
  },
];
const hidden: HiddenItem[] = [
  {
    id: 'h1',
    question: 'Can I deploy to production on a Friday afternoon?',
    answerable: true,
    goldAnswer: 'Not after 15:00',
    goldDocId: 'freeze',
    goldSpan: 'No production deploys go out after 15:00 on Fridays',
  },
];
// Room for about two pages.
const gates = [
  { metric: 'recall@k', value: 1 },
  { metric: 'mean_prompt_tokens', value: 80 },
];
const base = { topK: 4, rerank: false, chunkSize: 400 };

describe('R2 context packing', () => {
  it('copies fill the budget and push the answer out', async () => {
    const result = await gradeR2(
      { ...base, dedupe: 'none' },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.metrics.recall_at_k.value).toBe(0);
    expect(result.metrics.mean_prompt_tokens.value).toBeLessThanOrEqual(80);
    expect(result.scorecard.breakdown).toMatchObject({
      diagnosis: { 'packed-out-by-budget': 1 },
    });
  });

  it('exact dedupe misses copies that differ by a word', async () => {
    const result = await gradeR2(
      { ...base, dedupe: 'exact' },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.metrics.recall_at_k.value).toBe(0);
  });

  it('near dedupe collapses the copies so the answer fits', async () => {
    const result = await gradeR2(
      { ...base, dedupe: 'near', dedupeThreshold: 0.6 },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.verdict).toBe('pass');
  });

  it('a threshold that is too loose drops the answer as a "copy"', async () => {
    const result = await gradeR2(
      { ...base, dedupe: 'near', dedupeThreshold: 0.05 },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.scorecard.breakdown).toMatchObject({
      diagnosis: { 'deduped-away': 1 },
    });
  });
});
