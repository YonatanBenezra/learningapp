import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadAllExerciseBundles } from './content-loader';
import { runContentGrader } from './content-grader-runner';
import { loadPublishedSlugs } from './content-paths';

type Gate = { metric: string; op: string; value: number; advisory?: boolean };

function declaredGates(meta: { gates?: unknown }): Gate[] {
  return Array.isArray(meta.gates) ? (meta.gates as Gate[]) : [];
}

function enforcedGates(result: unknown): Gate[] {
  const gates = (result as { gateResults?: Gate[] }).gateResults ?? [];
  return gates.filter((gate) => !gate.advisory);
}

const key = (gate: Gate) => `${gate.metric} ${gate.op} ${gate.value}`;

/** Configs that used to pass by exploiting the grader; they must fail now. */
const EXPLOITS: Record<string, Record<string, unknown>> = {
  // Retrieve as much as the schema allows in the smallest chunks.
  'rag-r2': { topK: 40, rerank: false, chunkSize: 50 },
  // Whole-document chunks: recall is free when context has no cost.
  'rag-r1': { chunkSize: 2000, overlap: 0, splitStrategy: 'heading-aware' },
  // The same retrieve-everything profile for every query class.
  'rag-r5': Object.fromEntries(
    ['faq', 'policy', 'procedural'].flatMap((cls): [string, unknown][] => [
      [`${cls}TopK`, 40],
      [`${cls}Rerank`, false],
      [`${cls}ChunkSize`, 50],
    ]),
  ),
  // Guessing the flag format is not capturing it.
  'rag-redteam': { flag: 'LABPATH{flag}' },
};

describe('RAG content: reference, near-miss and gates', () => {
  it('grades every published RAG exercise against its declared gates', async () => {
    const published = new Set(
      loadPublishedSlugs().filter((slug) => slug.startsWith('rag-')),
    );
    const bundles = (await loadAllExerciseBundles()).filter((bundle) =>
      published.has(bundle.meta.slug),
    );
    expect(bundles.map((bundle) => bundle.meta.slug).sort()).toEqual(
      [...published].sort(),
    );

    for (const bundle of bundles) {
      const slug = bundle.meta.slug;
      const passed = await runContentGrader(bundle, bundle.reference);
      expect({ slug, verdict: passed.verdict }).toEqual({
        slug,
        verdict: 'pass',
      });
      expect(JSON.stringify(passed)).not.toContain('HIDDEN_EVAL');

      // meta.json is the single source of truth for what the grader enforces.
      expect({ slug, gates: enforcedGates(passed).map(key).sort() }).toEqual({
        slug,
        gates: declaredGates(bundle.meta).map(key).sort(),
      });

      const missed = await runContentGrader(bundle, bundle.nearMiss);
      expect({ slug, verdict: missed.verdict }).toEqual({
        slug,
        verdict: 'fail',
      });
      expect(JSON.stringify(missed)).not.toContain('HIDDEN_EVAL');

      const exploit = EXPLOITS[bundle.meta.graderArchetype];
      if (exploit) {
        const result = await runContentGrader(bundle, exploit);
        expect({ slug, exploit: result.verdict }).toEqual({
          slug,
          exploit: 'fail',
        });
      }
    }
  }, 300_000);
});

type EvalItem = {
  id: string;
  goldDocId: string | null;
  goldSpan: string | null;
};

const normalize = (text: string) =>
  text.toLowerCase().replace(/\s+/g, ' ').trim();

describe('RAG content: public samples stay off the hidden sets', () => {
  it('never reuses a hidden gold fact from any exercise on the same corpus', async () => {
    const published = new Set(
      loadPublishedSlugs().filter((slug) => slug.startsWith('rag-')),
    );
    const bundles = (await loadAllExerciseBundles()).filter((bundle) =>
      published.has(bundle.meta.slug),
    );
    // Red team hidden assets are scenario objects, not Q/A lists.
    const read = (file: string) => {
      const value = JSON.parse(readFileSync(file, 'utf8')) as unknown;
      return Array.isArray(value) ? (value as EvalItem[]) : [];
    };
    const corpusOf = (bundle: (typeof bundles)[number]) =>
      bundle.meta.corpusFile === 'shared'
        ? path.join(process.cwd(), 'content/corpora/internal-policy.json')
        : path.join(bundle.dir, 'corpus.json');

    // Hidden gold facts, pooled per corpus content: a public sample of one
    // exercise must not reveal a hidden answer of another on the same docs.
    const hiddenByCorpus = new Map<string, Set<string>>();
    for (const bundle of bundles) {
      const corpus = readFileSync(corpusOf(bundle), 'utf8');
      const spans = hiddenByCorpus.get(corpus) ?? new Set<string>();
      for (const item of read(path.join(bundle.dir, 'eval_hidden.json'))) {
        if (item.goldSpan) {
          spans.add(normalize(item.goldSpan));
        }
      }
      hiddenByCorpus.set(corpus, spans);
    }

    for (const bundle of bundles) {
      const corpusRaw = readFileSync(corpusOf(bundle), 'utf8');
      const docs = new Map(
        (
          JSON.parse(corpusRaw) as { id: string; title: string; text: string }[]
        ).map((doc) => [doc.id, normalize(`${doc.title}. ${doc.text}`)]),
      );
      const hidden = hiddenByCorpus.get(corpusRaw)!;
      for (const item of read(path.join(bundle.dir, 'eval_public.json'))) {
        if (!item.goldSpan || !item.goldDocId) {
          continue;
        }
        const span = normalize(item.goldSpan);
        const where = `${bundle.meta.slug}/${item.id}`;
        expect({
          where,
          inDoc: docs.get(item.goldDocId)?.includes(span),
        }).toEqual({
          where,
          inDoc: true,
        });
        const leaks = [...hidden].some(
          (gold) => gold.includes(span) || span.includes(gold),
        );
        expect({ where, leaks }).toEqual({ where, leaks: false });
      }
    }
  });
});
