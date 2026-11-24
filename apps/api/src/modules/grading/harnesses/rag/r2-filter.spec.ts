import type { CorpusDoc } from './chunking';
import { gradeR2 } from './r2.grade';
import type { HiddenItem } from './rag.types';

const version = (
  year: string,
  status: 'current' | 'superseded' | 'draft',
  days: string,
  extra = '',
): CorpusDoc => ({
  id: `expenses-${year}`,
  title: 'Expense claims',
  text: `Expense claims must be filed within ${days} days of the purchase.${extra}`,
  meta: {
    family: 'expenses',
    version: year,
    status,
    effective: `${year}-01-01`,
  },
});

// The superseded version repeats the question's words, so it ranks first.
const docs: CorpusDoc[] = [
  version(
    '2024',
    'superseded',
    '60',
    ' File expense claims early; late expense claims are declined.',
  ),
  version('2026', 'current', '30'),
  version('2027', 'draft', '45'),
  { id: 'parking', title: 'Parking', text: 'Parking permits last one year.' },
];
const hidden: HiddenItem[] = [
  {
    id: 'h1',
    question: 'Within how many days must I file expense claims?',
    answerable: true,
    goldAnswer: '30',
    goldDocId: 'expenses-2026',
    goldSpan: 'Expense claims must be filed within 30 days of the purchase',
  },
];
const gates = [
  { metric: 'recall@k', value: 1 },
  { metric: 'stale_context_rate', value: 0 },
  { metric: 'mean_prompt_tokens', value: 500 },
];

describe('R2 status filter', () => {
  it('counts another version of the policy in context as stale', async () => {
    const result = await gradeR2(
      { topK: 3, rerank: false, chunkSize: 400 },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.metrics.recall_at_k.value).toBe(1);
    expect(result.metrics.stale_context_rate.value).toBe(1);
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('stale-version-in-context');
  });

  it('a current-only pre-filter keeps only the current version', async () => {
    const result = await gradeR2(
      {
        topK: 1,
        rerank: false,
        chunkSize: 400,
        statusFilter: 'current-only',
        filterStage: 'pre',
      },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.stale_context_rate.value).toBe(0);
  });

  it('a post-filter after top-1 can leave the context empty', async () => {
    const result = await gradeR2(
      {
        topK: 1,
        rerank: false,
        chunkSize: 400,
        statusFilter: 'current-only',
        filterStage: 'post',
      },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.metrics.recall_at_k.value).toBe(0);
    expect(result.scorecard.breakdown).toMatchObject({
      diagnosis: { 'post-filter-dropped-results': 1 },
    });
  });

  it('exclude-superseded still lets the draft in', async () => {
    const result = await gradeR2(
      {
        topK: 2,
        rerank: false,
        chunkSize: 400,
        statusFilter: 'exclude-superseded',
        filterStage: 'pre',
      },
      docs,
      hidden,
      [],
      gates,
    );
    expect(result.metrics.stale_context_rate.value).toBe(1);
  });
});
