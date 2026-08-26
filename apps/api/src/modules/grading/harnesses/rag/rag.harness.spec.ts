import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gradeR1 } from './r1.grade';
import type { CorpusDoc } from './chunking';
import type { HiddenItem } from './rag.types';

const contentRoot = path.join(
  process.cwd(),
  'content/exercises/rag-001-chunk-it-right',
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(contentRoot, name), 'utf8')) as T;
}

describe('RagHarness R1', () => {
  const docs = loadJson<CorpusDoc[]>('corpus.json');
  const hidden = loadJson<HiddenItem[]>('eval_hidden.json');
  const publicItems = loadJson<HiddenItem[]>('eval_public.json');

  it('passes with heading-aware reference chunking', () => {
    const result = gradeR1(
      { chunkSize: 400, overlap: 80, splitStrategy: 'heading-aware' },
      docs,
      hidden,
      publicItems,
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.recall_at_5.value).toBeGreaterThanOrEqual(0.8);
    expect(JSON.stringify(result)).not.toContain(
      'HIDDEN_EVAL_R1_CANARY_PHRASE',
    );
    expect(JSON.stringify(result.trace)).not.toContain('goldSpan');
    expect(result.trace.queries.some((row) => row.source === 'public')).toBe(
      true,
    );
  });

  it('fails with tiny fixed windows (near-miss)', () => {
    const result = gradeR1(
      { chunkSize: 50, overlap: 0, splitStrategy: 'fixed' },
      docs,
      hidden,
      publicItems,
    );
    expect(result.verdict).toBe('fail');
    expect(result.metrics.recall_at_5.value).toBeLessThan(0.8);
    expect(result.failureClasses.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain(
      'HIDDEN_EVAL_R1_CANARY_PHRASE',
    );
    expect(JSON.stringify(result.trace)).not.toContain('goldSpan');
    expect(
      result.trace.queries.some((row) => row.source === 'failing_sample'),
    ).toBe(true);
  });

  it('is deterministic', () => {
    const payload = {
      chunkSize: 400,
      overlap: 80,
      splitStrategy: 'heading-aware' as const,
    };
    const a = gradeR1(payload, docs, hidden, publicItems);
    const b = gradeR1(payload, docs, hidden, publicItems);
    expect(a.verdict).toBe(b.verdict);
    expect(a.metrics.recall_at_5.value).toBe(b.metrics.recall_at_5.value);
    expect(a.trace.queries).toEqual(b.trace.queries);
  });
});
