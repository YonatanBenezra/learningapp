import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CorpusDoc } from '../modules/grading/harnesses/rag/chunking';
import { EVAL_TAGS } from '../modules/grading/harnesses/rag/rag.shared';
import type {
  EvalBreakdown,
  FailingCase,
  HiddenItem,
  TraceQuery,
} from '../modules/grading/harnesses/rag/rag.types';
import { runContentGrader } from './content-grader-runner';
import { loadAllExerciseBundles } from './content-loader';
import { corpusPathFor, loadPublishedSlugs } from './content-paths';

const root = process.cwd();
const norm = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
const isCanary = (question: string) => question.includes('HIDDEN_EVAL');

type Bundle = Awaited<ReturnType<typeof loadAllExerciseBundles>>[number];

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function corpusOf(bundle: Bundle): CorpusDoc[] {
  return readJson<CorpusDoc[]>(corpusPathFor(bundle.dir, bundle.meta));
}

/** Published RAG exercises whose hidden set is a question list. */
async function ragBundles() {
  const published = new Set(loadPublishedSlugs());
  const bundles = (await loadAllExerciseBundles()).filter(
    (bundle) =>
      published.has(bundle.meta.slug) &&
      bundle.meta.graderArchetype.startsWith('rag-') &&
      bundle.meta.graderArchetype !== 'rag-redteam',
  );
  return bundles.map((bundle) => ({
    bundle,
    hidden: readJson<(HiddenItem & { class?: string })[]>(
      path.join(bundle.dir, 'eval_hidden.json'),
    ),
    publicItems: readJson<
      {
        question: string;
        goldDocId?: string | null;
        goldSpan?: string | null;
      }[]
    >(path.join(bundle.dir, 'eval_public.json')),
  }));
}

describe('RAG eval invariants', () => {
  it('split and tags are current (re-run scripts/content/tag-rag-eval.mjs)', () => {
    expect(() =>
      execFileSync('node', ['scripts/content/tag-rag-eval.mjs', '--check'], {
        cwd: root,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it.each([
    'build-support-kb.mjs',
    'build-policy-history.mjs',
    'build-help-center.mjs',
    'build-team-wiki.mjs',
  ])('generated corpora are current (re-run scripts/content/%s)', (script) => {
    expect(() =>
      execFileSync('node', [`scripts/content/${script}`, '--check'], {
        cwd: root,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('every hidden item has a split and known tags, with enough feedback to learn from', async () => {
    const allowed = new Set<string>(EVAL_TAGS);
    for (const { bundle, hidden } of await ragBundles()) {
      const slug = bundle.meta.slug;
      const real = hidden.filter((item) => !isCanary(item.question));
      for (const item of real) {
        expect({ slug, id: item.id, split: item.split }).toEqual({
          slug,
          id: item.id,
          split: expect.stringMatching(/^(feedback|holdout)$/) as string,
        });
        expect((item.tags ?? []).length).toBeGreaterThan(0);
        expect((item.tags ?? []).filter((tag) => !allowed.has(tag))).toEqual(
          [],
        );
      }
      const feedback = real.filter(
        (item) => item.split === 'feedback' && item.answerable,
      );
      expect({ slug, feedback: feedback.length >= 3 }).toEqual({
        slug,
        feedback: true,
      });
      // Most of the set must stay unseen.
      expect({
        slug,
        holdoutShare:
          real.filter((item) => item.split === 'holdout').length /
            real.length >=
          0.6,
      }).toEqual({ slug, holdoutShare: true });
    }
  });

  it('a question has the same split in every exercise that uses it', async () => {
    const seen = new Map<string, { split: string; slug: string }>();
    for (const { bundle, hidden } of await ragBundles()) {
      for (const item of hidden) {
        if (isCanary(item.question)) {
          continue;
        }
        const key = norm(item.question);
        const prior = seen.get(key);
        if (prior) {
          expect({ question: key, split: item.split }).toEqual({
            question: key,
            split: prior.split,
          });
        } else {
          seen.set(key, {
            split: item.split as string,
            slug: bundle.meta.slug,
          });
        }
      }
    }
  });

  it('public samples never appear in the hidden set, and every gold span exists in its doc', async () => {
    for (const { bundle, hidden, publicItems } of await ragBundles()) {
      const slug = bundle.meta.slug;
      const hiddenQuestions = new Set(
        hidden.map((item) => norm(item.question)),
      );
      expect({
        slug,
        overlap: publicItems.filter((item) =>
          hiddenQuestions.has(norm(item.question)),
        ),
      }).toEqual({ slug, overlap: [] });

      const docs = new Map(
        corpusOf(bundle).map((doc) => [doc.id, `${doc.title}. ${doc.text}`]),
      );
      for (const item of [...hidden, ...publicItems]) {
        if (!item.goldDocId || !item.goldSpan) {
          continue;
        }
        expect({
          slug,
          gold: item.goldSpan,
          found: docs.get(item.goldDocId)?.includes(item.goldSpan) ?? false,
        }).toEqual({ slug, gold: item.goldSpan, found: true });
      }
    }
  });

  it('graders only ever reveal feedback questions, and count the rest', async () => {
    for (const { bundle, hidden } of await ragBundles()) {
      const slug = bundle.meta.slug;
      const feedback = new Set(
        hidden
          .filter((item) => item.split === 'feedback')
          .map((item) => norm(item.question)),
      );
      for (const payload of [bundle.reference, bundle.nearMiss]) {
        const result = (await runContentGrader(bundle, payload)) as unknown as {
          failingCases: FailingCase[];
          trace: { queries: TraceQuery[] };
          scorecard: { breakdown?: EvalBreakdown };
        };
        const revealed = [
          ...result.failingCases
            .map((row) => row.question)
            .filter((q) => q !== 'sandbox execution'),
          ...result.trace.queries
            .filter((row) => row.source === 'failing_sample')
            .map((row) => row.question),
        ];
        expect({
          slug,
          leaked: revealed.filter((q) => !feedback.has(norm(q))),
        }).toEqual({ slug, leaked: [] });

        const breakdown = result.scorecard.breakdown;
        if (breakdown) {
          const counted =
            breakdown.bySplit.feedback.total + breakdown.bySplit.holdout.total;
          expect({ slug, counted: counted > 0 }).toEqual({
            slug,
            counted: true,
          });
        }
      }
    }
  }, 120_000);
});
