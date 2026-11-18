import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  R3_NEAR_MISS_PAYLOAD,
  R3_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from './chunking';
import { gradeR3, type R3Generator } from './r3.grade';
import type { HiddenItem } from './rag.types';

const docs = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'content/corpora/internal-policy.json'),
    'utf8',
  ),
) as CorpusDoc[];
const hidden = JSON.parse(
  readFileSync(
    path.join(__dirname, '../__fixtures__/internal-policy/r3.eval_hidden.json'),
    'utf8',
  ),
) as HiddenItem[];
const publicItems = JSON.parse(
  readFileSync(
    path.join(__dirname, '../__fixtures__/internal-policy/r3.eval_public.json'),
    'utf8',
  ),
) as HiddenItem[];

const goldByQuestion = new Map(
  hidden.map((item) => [item.question, item] as const),
);

/** Scripted stand-in for a model that follows the citation contract. */
const compliantModel: R3Generator = ({ question, ranked }) => {
  const item = goldByQuestion.get(question);
  if (!item?.answerable || !item.goldSpan) {
    return Promise.resolve("I don't know.");
  }
  const gold = item.goldSpan.toLowerCase();
  const cited =
    ranked.find((row) => row.chunk.text.toLowerCase().includes(gold)) ??
    ranked[0];
  return Promise.resolve(`${item.goldSpan} [chunk:${cited.chunk.id}]`);
};

describe('gradeR3', () => {
  it('passes when the model cites the gold chunk and refuses off-corpus questions', async () => {
    const result = await gradeR3(
      R3_REFERENCE_PAYLOAD,
      docs,
      hidden,
      publicItems,
      compliantModel,
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.gold_span_overlap.value).toBeGreaterThanOrEqual(0.85);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('sends the learner prompt verbatim as the system message', async () => {
    const seen: { system: string; user: string }[] = [];
    await gradeR3(R3_REFERENCE_PAYLOAD, docs, hidden, publicItems, (input) => {
      seen.push(input);
      return Promise.resolve("I don't know.");
    });
    expect(seen.length).toBeGreaterThan(0);
    expect(
      seen.every((row) => row.system === R3_REFERENCE_PAYLOAD.generationPrompt),
    ).toBe(true);
    expect(seen[0].user).toMatch(/^Question: /);
    expect(seen[0].user).toMatch(/\(id: [^)]+\) /);
    expect(seen.some((row) => row.user.includes('HIDDEN_EVAL'))).toBe(false);
  });

  it('fails answers without citations and shows what the model said', async () => {
    const result = await gradeR3(
      R3_NEAR_MISS_PAYLOAD,
      docs,
      hidden,
      publicItems,
      ({ ranked }) => Promise.resolve(ranked[0]?.chunk.text.slice(0, 80) ?? ''),
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('format-drift');
    expect(result.failingCases[0]?.answer).toBeTruthy();
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('flags citations to chunks that were not retrieved', async () => {
    const result = await gradeR3(
      R3_REFERENCE_PAYLOAD,
      docs,
      hidden,
      publicItems,
      () => Promise.resolve('Twenty-two days. [chunk:made-up:9]'),
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('hallucinated-citation');
  });
});
