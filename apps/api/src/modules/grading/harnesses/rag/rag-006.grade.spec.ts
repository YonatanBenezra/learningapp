import { readFileSync } from 'node:fs';
import path from 'node:path';
import { corpusPathFor } from '../../../../content/content-paths';
import { gradeR1 } from './r1.grade';
import { parseR1Payload } from './rag.payloads';
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
  const meta = loadJson<{ gates: unknown; corpusFile?: string }>('meta.json');
  const docs = JSON.parse(
    readFileSync(corpusPathFor(contentRoot, meta), 'utf8'),
  ) as CorpusDoc[];
  const hidden = loadJson<HiddenItem[]>('eval_hidden.json');
  const publicItems = loadJson<{ question: string }[]>('eval_public.json');

  it('passes with published reference payload', () => {
    const result = gradeR1(
      parseR1Payload(loadJson('solution/reference.json')),
      docs,
      hidden,
      publicItems,
      meta.gates,
    );
    expect(result.verdict).toBe('pass');
    expect(result.trace.queries.length).toBeGreaterThan(0);
    expect(JSON.stringify(result.trace)).not.toContain('goldSpan');
  });
});
