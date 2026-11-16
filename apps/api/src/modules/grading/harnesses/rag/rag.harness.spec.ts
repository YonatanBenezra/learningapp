import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  R1_NEAR_MISS_PAYLOAD,
  R1_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
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
  const gates = loadJson<{ gates: unknown }>('meta.json').gates;

  it('passes with the reference sentence chunking', () => {
    const result = gradeR1(
      R1_REFERENCE_PAYLOAD,
      docs,
      hidden,
      publicItems,
      gates,
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

  it('fails with tiny fixed windows that cut sentences', () => {
    const result = gradeR1(
      { chunkSize: 50, overlap: 0, splitStrategy: 'fixed' },
      docs,
      hidden,
      publicItems,
      gates,
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

  it('fails whole-document chunks on the context budget despite full recall', () => {
    const result = gradeR1(
      R1_NEAR_MISS_PAYLOAD,
      docs,
      hidden,
      publicItems,
      gates,
    );
    expect(result.verdict).toBe('fail');
    expect(result.metrics.recall_at_5.value).toBe(1);
    const budget = result.gateResults.find(
      (gate) => gate.metric === 'mean_context_tokens',
    );
    expect(budget?.passed).toBe(false);
    expect(result.failureClasses).toContain('context-over-budget');
  });

  it('is deterministic', () => {
    const a = gradeR1(R1_REFERENCE_PAYLOAD, docs, hidden, publicItems, gates);
    const b = gradeR1(R1_REFERENCE_PAYLOAD, docs, hidden, publicItems, gates);
    expect(a.verdict).toBe(b.verdict);
    expect(a.metrics.recall_at_5.value).toBe(b.metrics.recall_at_5.value);
    expect(a.trace.queries).toEqual(b.trace.queries);
  });
});
