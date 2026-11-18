import { readFileSync } from 'node:fs';
import { loadAllExerciseBundles } from './content-loader';
import { runContentGrader } from './content-grader-runner';

/**
 * One exercise, one mechanic: for each exercise built around a mechanic, every
 * config that skips it must fail, and the reference (which uses it) must pass.
 * The shortcuts are the configs a learner would try first.
 */
const STRATEGIES = ['fixed', 'sentence', 'recursive', 'heading-aware'] as const;
/** 50 to 600 characters in steps of 25. */
const CHUNK_SIZES = Array.from({ length: 23 }, (_, i) => 50 + i * 25);
const R3_PROMPT = (
  JSON.parse(
    readFileSync(
      'content/exercises/rag-027-adv-citation-contract/solution/reference.json',
      'utf8',
    ),
  ) as { generationPrompt: string }
).generationPrompt;

/** R5 with the router off: every question uses the same profile. */
function oneProfile(
  defaultRoute: string,
  topK: number,
  rerank: boolean,
  chunkSize: number,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    router: 'none',
    defaultRoute,
    routingRules: '',
  };
  for (const cls of ['faq', 'policy', 'procedural']) {
    payload[`${cls}TopK`] = topK;
    payload[`${cls}Rerank`] = rerank;
    payload[`${cls}ChunkSize`] = chunkSize;
  }
  return payload;
}

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
  {
    slug: 'rag-028-adv-rerank-rethink',
    mechanic: 'a query rewrite',
    // Every reranker and window, searching with the question as asked.
    shortcuts: (
      ['none', 'title-boost', 'mmr', 'cross-encoder'] as const
    ).flatMap((reranker) =>
      [5, 10, 20, 30, 40, 50].map((rerankTopN) => ({
        reranker,
        rerankTopN,
        queryRewritePrompt: '',
      })),
    ),
  },
  {
    slug: 'rag-030-adv-score-gate',
    mechanic: 'a second hop that carries the names the first one found',
    // One search at every k, and a second search that pastes whole passages.
    shortcuts: Array.from({ length: 10 }, (_, i) => i + 1).flatMap((topK) => [
      { topK, hops: 1 },
      ...[1, 2, 3, 5].map((hopSeeds) => ({
        topK,
        hops: 2,
        hopSeeds,
        hopQuery: 'passage',
      })),
    ]),
  },
  {
    slug: 'rag-006-overlap-tune',
    mechanic: 'chunk overlap',
    // Every strategy and chunk size, with no overlap.
    shortcuts: STRATEGIES.flatMap((splitStrategy) =>
      CHUNK_SIZES.map((chunkSize) => ({
        chunkSize,
        overlap: 0,
        splitStrategy,
      })),
    ),
  },
  {
    slug: 'rag-010-window-fit',
    mechanic: 'a split that keeps the section heading with its rows',
    // Every strategy that cuts rows loose from their heading, at any size.
    shortcuts: (['fixed', 'sentence', 'recursive'] as const).flatMap(
      (splitStrategy) =>
        CHUNK_SIZES.flatMap((chunkSize) =>
          [0, 30].map((overlap) => ({ chunkSize, overlap, splitStrategy })),
        ),
    ),
  },
  {
    slug: 'rag-027-adv-citation-contract',
    mechanic: 'a calibrated refuse-below-score threshold',
    // The reference prompt with no threshold, too low a threshold, or too high.
    shortcuts: [0, 2, 4, 4.5, 12, 15, 20, 30].map((refuseBelowScore) => ({
      generationPrompt: R3_PROMPT,
      refuseBelowScore,
    })),
  },
  {
    slug: 'rag-031-query-routing',
    mechanic: 'a router',
    // One profile for every question: each default route, across profiles.
    shortcuts: (['faq', 'policy', 'procedural'] as const).flatMap((route) =>
      [1, 2, 3].flatMap((topK) =>
        [false, true].flatMap((rerank) =>
          [100, 200, 300, 400].map((chunkSize) =>
            oneProfile(route, topK, rerank, chunkSize),
          ),
        ),
      ),
    ),
  },
  {
    slug: 'rag-032-two-languages',
    mechanic: 'a multilingual embedding model',
    // Keyword search, or the English embedding model, at every k and alpha.
    shortcuts: Array.from({ length: 10 }, (_, i) => i + 1).flatMap((topK) => [
      { retrievalMode: 'bm25', embeddingModel: 'english', topK },
      { retrievalMode: 'dense', embeddingModel: 'english', topK },
      ...[0.3, 0.5, 0.7, 0.9].map((hybridAlpha) => ({
        retrievalMode: 'hybrid',
        embeddingModel: 'english',
        hybridAlpha,
        topK,
      })),
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
