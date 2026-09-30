import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gradeR1 } from './r1.grade';
import type { CorpusDoc } from './chunking';
import type { HiddenItem } from './rag.types';

const contentRoot = path.join(
  process.cwd(),
  'content/exercises/rag-006-overlap-tune',
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(contentRoot, name), 'utf8')) as T;
}

describe('RagHarness R1 — rag-006-overlap-tune', () => {
  const docs = loadJson<CorpusDoc[]>('corpus.json');
  const hidden = loadJson<HiddenItem[]>('eval_hidden.json');
  const publicItems = loadJson<{ question: string }[]>('eval_public.json');

  it('passes with published reference payload', () => {
    const result = gradeR1(
      { chunkSize: 400, overlap: 80, splitStrategy: 'heading-aware' },
      docs,
      hidden,
      publicItems,
    );
    expect(result.verdict).toBe('pass');
    expect(result.trace.queries.length).toBeGreaterThan(0);
    expect(JSON.stringify(result.trace)).not.toContain('goldSpan');
  });
});
