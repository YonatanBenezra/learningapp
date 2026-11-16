import { estimateTokens } from '../../gateway/pricing';
import type { Chunk, CorpusDoc } from './chunking';
import { chunkForR2, retrieveForR2 } from './r2.grade';
import {
  declaresGate,
  expandGoldSpan,
  FAILING_SAMPLE_LIMIT,
  gateThreshold,
  publicGold,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import { chunkContainsSpan, retrieveRanked } from './retrieve';
import type {
  GateResult,
  HiddenItem,
  PublicItem,
  R2Payload,
  RagGradeResult,
  TraceQuery,
} from './rag.types';

/**
 * R5 — query routing. Each question arrives with its class (the router is
 * given); the learner picks one retrieval profile per class. FAQ answers are
 * one short sentence, policy questions fight keyword-stuffed noise, and
 * procedural answers span several consecutive sentences, so no single profile
 * is both cheap and complete.
 */

export const R5_CLASSES = ['faq', 'policy', 'procedural'] as const;
export type R5Class = (typeof R5_CLASSES)[number];

export type R5Payload = Record<R5Class, R2Payload>;

export type RoutedItem = HiddenItem & { class?: string };
export type RoutedPublicItem = PublicItem;

const DEFAULT_RECALL = 0.85;
const DEFAULT_TOKEN_CEILING = 100;

export function isR5Class(value: unknown): value is R5Class {
  return (R5_CLASSES as readonly unknown[]).includes(value);
}

/** Flat form fields (faqTopK, policyRerank, ...) -> one profile per class. */
export function parseR5Payload(payload: unknown): R5Payload {
  const record = (payload ?? {}) as Record<string, unknown>;
  const profile = (cls: R5Class): R2Payload => {
    const topK = record[`${cls}TopK`];
    const rerank = record[`${cls}Rerank`];
    const chunkSize = record[`${cls}ChunkSize`];
    if (
      typeof topK !== 'number' ||
      typeof rerank !== 'boolean' ||
      typeof chunkSize !== 'number'
    ) {
      throw new Error(`R5 payload is missing the ${cls} profile`);
    }
    return { topK, rerank, chunkSize };
  };
  return {
    faq: profile('faq'),
    policy: profile('policy'),
    procedural: profile('procedural'),
  };
}

/** Chunks per chunk size, so classes that share a size share the index. */
function chunkCache(docs: CorpusDoc[]) {
  const cache = new Map<number, Chunk[]>();
  return (profile: R2Payload) => {
    const cached = cache.get(profile.chunkSize);
    if (cached) {
      return cached;
    }
    const chunks = chunkForR2(docs, profile);
    cache.set(profile.chunkSize, chunks);
    return chunks;
  };
}

/** Gold text for an item: the containing sentence, or the span itself when it covers several. */
function goldFor(docs: CorpusDoc[], item: RoutedItem): string {
  return expandGoldSpan(
    docs,
    item.goldDocId as string,
    item.goldSpan as string,
  );
}

export function routeR5(
  question: string,
  cls: R5Class,
  docs: CorpusDoc[],
  payload: R5Payload,
  chunksFor = chunkCache(docs),
) {
  const profile = payload[cls];
  const chunks = chunksFor(profile);
  const ranked = retrieveForR2(question, chunks, profile);
  const tokens = estimateTokens(
    `Context:\n${ranked.map((row) => row.chunk.text).join('\n\n')}`,
  );
  return { profile, chunks, ranked, tokens };
}

export function gradeR5(
  payload: R5Payload,
  docs: CorpusDoc[],
  hidden: RoutedItem[],
  publicItems: RoutedPublicItem[] = [],
  gates?: unknown,
): RagGradeResult {
  const chunksFor = chunkCache(docs);
  const answerable = hidden.filter(
    (item) =>
      item.answerable &&
      item.goldDocId &&
      item.goldSpan &&
      isR5Class(item.class) &&
      !item.question.includes('HIDDEN_EVAL'),
  );
  const hits: Record<R5Class, number> = { faq: 0, policy: 0, procedural: 0 };
  const totals: Record<R5Class, number> = { faq: 0, policy: 0, procedural: 0 };
  const tokens: number[] = [];
  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];

  for (const item of answerable) {
    const cls = item.class as R5Class;
    const { ranked, tokens: used } = routeR5(
      item.question,
      cls,
      docs,
      payload,
      chunksFor,
    );
    tokens.push(used);
    totals[cls] += 1;
    const gold = goldFor(docs, item);
    if (ranked.some((row) => chunkContainsSpan(row.chunk.text, gold))) {
      hits[cls] += 1;
    } else if (misses.length < FAILING_SAMPLE_LIMIT) {
      misses.push({
        question: item.question,
        goldSpan: gold,
        retrieved: ranked.map((row) => row.chunk.text.slice(0, 220)),
        note: `${cls} profile missed`,
      });
      failingQueries.push(
        toTraceQuery('failing_sample', item.question, ranked, {
          contextTokens: used,
        }),
      );
    }
  }

  const recall = (cls: R5Class) =>
    totals[cls] === 0 ? 0 : hits[cls] / totals[cls];
  const meanTokens =
    tokens.length === 0
      ? 0
      : tokens.reduce((sum, value) => sum + value, 0) / tokens.length;
  const tokenCeiling = gateThreshold(
    gates,
    'mean_prompt_tokens',
    DEFAULT_TOKEN_CEILING,
  );

  const gateResults: GateResult[] = R5_CLASSES.map((cls) => {
    const metric = `recall_${cls}`;
    const value = gateThreshold(gates, metric, DEFAULT_RECALL);
    const actual = recall(cls);
    return {
      id: `recall-${cls}`,
      class: 'A' as const,
      metric,
      op: 'gte',
      value,
      actual,
      passed: actual >= value,
    };
  });
  if (declaresGate(gates, 'mean_prompt_tokens') || gates === undefined) {
    gateResults.push({
      id: 'mean-prompt-tokens',
      class: 'A',
      metric: 'mean_prompt_tokens',
      op: 'lte',
      value: tokenCeiling,
      actual: meanTokens,
      passed: meanTokens <= tokenCeiling,
    });
  }
  const passed = gateResults.every((gate) => gate.passed);

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      recall_faq: { value: recall('faq'), hits: hits.faq, total: totals.faq },
      recall_policy: {
        value: recall('policy'),
        hits: hits.policy,
        total: totals.policy,
      },
      recall_procedural: {
        value: recall('procedural'),
        hits: hits.procedural,
        total: totals.procedural,
      },
      mean_prompt_tokens: { value: meanTokens },
    },
    gateResults,
    failureClasses: passed ? [] : r5FailureClasses(payload, gateResults),
    scorecard: {
      recallFaq: recall('faq'),
      recallPolicy: recall('policy'),
      recallProcedural: recall('procedural'),
      meanPromptTokens: meanTokens,
      tokenCeiling,
    },
    failingCases: misses,
    trace: {
      simulator: 'rag',
      payload,
      k: Math.max(...R5_CLASSES.map((cls) => payload[cls].topK)),
      chunkCount: chunksFor(payload.policy).length,
      tokensIn: Math.round(tokens.reduce((sum, value) => sum + value, 0)),
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...publicTraceItems(publicItems)
          .filter((item) => isR5Class(item.class))
          .map((item) => {
            const cls = item.class as R5Class;
            const routed = routeR5(
              item.question,
              cls,
              docs,
              payload,
              chunksFor,
            );
            return toTraceQuery(
              'public',
              `[${cls}] ${item.question}`,
              routed.ranked,
              {
                gold: publicGold(docs, item),
                firstStage: routed.profile.rerank
                  ? retrieveRanked(
                      item.question,
                      routed.chunks,
                      routed.ranked.length * 4,
                    )
                  : null,
                contextTokens: routed.tokens,
              },
            );
          }),
        ...failingQueries,
      ],
    },
  };
}

function r5FailureClasses(payload: R5Payload, gates: GateResult[]): string[] {
  const failed = new Set(
    gates.filter((gate) => !gate.passed).map((gate) => gate.metric),
  );
  const classes: string[] = [];
  if (failed.has('recall_procedural') && payload.procedural.chunkSize < 400) {
    classes.push('procedural-chunks-too-small');
  }
  if (failed.has('recall_policy') && !payload.policy.rerank) {
    classes.push('policy-needs-rerank');
  }
  if (failed.has('mean_prompt_tokens')) {
    classes.push('one-profile-for-all');
  }
  for (const cls of R5_CLASSES) {
    if (failed.has(`recall_${cls}`)) {
      classes.push(`${cls}-recall`);
    }
  }
  return classes.length > 0 ? classes : ['routing'];
}
