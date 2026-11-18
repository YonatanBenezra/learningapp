import { loadAllExerciseBundles } from './content-loader';
import { runContentGrader } from './content-grader-runner';

/**
 * One exercise, one mechanic: for each exercise built around a mechanic, every
 * config that skips it must fail, and the reference (which uses it) must pass.
 * The shortcuts are the configs a learner would try first.
 */
const MECHANICS: {
  slug: string;
  mechanic: string;
  shortcuts: Record<string, unknown>[];
}[] = [
  {
    slug: 'rag-018-retriever-run',
    mechanic: 'hybrid search',
    // Every top-k the schema allows, with keyword search alone or dense alone.
    shortcuts: Array.from({ length: 10 }, (_, i) => i + 1).flatMap((topK) => [
      { retrievalMode: 'bm25', hybridAlpha: 0.5, topK },
      { retrievalMode: 'dense', hybridAlpha: 0.5, topK },
    ]),
  },
  {
    slug: 'rag-008-spend-cap',
    mechanic: 'a current-only metadata filter',
    // No filter, or a filter that lets drafts through, at every k and stage.
    shortcuts: (['none', 'exclude-superseded'] as const).flatMap(
      (statusFilter) =>
        (['pre', 'post'] as const).flatMap((filterStage) =>
          Array.from({ length: 10 }, (_, i) => ({
            statusFilter,
            filterStage,
            topK: i + 1,
          })),
        ),
    ),
  },
  {
    slug: 'rag-021-rank-boost',
    mechanic: 'a cross-encoder reranker',
    // The heuristic rerankers, and no rerank, at every candidate window.
    shortcuts: (['none', 'title-boost', 'mmr'] as const).flatMap((reranker) =>
      [5, 10, 20, 30, 40, 50].map((rerankTopN) => ({ reranker, rerankTopN })),
    ),
  },
  {
    slug: 'rag-022-score-gate',
    mechanic: 'near-duplicate removal before packing',
    // No dedupe, exact-only dedupe, or a threshold above how alike copies are.
    shortcuts: Array.from({ length: 10 }, (_, i) => i + 1).flatMap((topK) => [
      { topK, dedupe: 'none' },
      { topK, dedupe: 'exact' },
      { topK, dedupe: 'near', dedupeThreshold: 0.95 },
    ]),
  },
];

describe('RAG exercises teach their mechanic', () => {
  it.each(MECHANICS)(
    '$slug needs $mechanic',
    async ({ slug, shortcuts }) => {
      const bundle = (await loadAllExerciseBundles()).find(
        (item) => item.meta.slug === slug,
      );
      expect(bundle).toBeDefined();
      const reference = await runContentGrader(bundle!, bundle!.reference);
      expect({ slug, reference: reference.verdict }).toEqual({
        slug,
        reference: 'pass',
      });
      for (const payload of shortcuts) {
        const result = await runContentGrader(bundle!, payload);
        expect({ payload, verdict: result.verdict }).toEqual({
          payload,
          verdict: 'fail',
        });
      }
    },
    300_000,
  );
});
