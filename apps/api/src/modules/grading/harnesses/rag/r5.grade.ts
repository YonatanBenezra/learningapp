import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import { countTokens } from '../../gateway/pricing';
import { chunkCorpus, type Chunk, type CorpusDoc } from './chunking';
import { chunkForR2, diagnoseR2Miss, retrieveForR2 } from './r2.grade';
import {
  costEvidence,
  declaresGate,
  EvalLedger,
  goldOf,
  gateThreshold,
  publicGold,
  publicTraceItems,
  toTraceQuery,
} from './rag.shared';
import { type Gold, holdsGold, retrieveRanked } from './retrieve';
import { bm25Retriever, type Retriever } from './retrievers';
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

/**
 * How each question picks its profile:
 * - given: the class labelled on the question (the old, oracle router).
 * - none: every question uses the default route.
 * - rules: the first rule whose phrase the question contains, else default.
 * - top-document: the route of the best-matching document (BM25 over whole
 *   documents), else default.
 */
export type R5RouterMode = 'given' | 'none' | 'rules' | 'top-document';
export const R5_ROUTER_MODES: R5RouterMode[] = [
  'given',
  'none',
  'rules',
  'top-document',
];

export type RoutingRule = { phrases: string[]; route: R5Class };

export type R5Router = {
  mode: R5RouterMode;
  rules: RoutingRule[];
  defaultRoute: R5Class;
};

export type R5Payload = Record<R5Class, R2Payload> & { router: R5Router };

/**
 * Routing rules, one per line: `phrase | phrase => class`. A question takes
 * the first line with a phrase it contains (case-insensitive); `*` matches
 * everything. Blank lines and lines starting with # are skipped.
 */
export function parseRoutingRules(text: string): RoutingRule[] {
  const rules: RoutingRule[] = [];
  text.split('\n').forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      return;
    }
    const [left, right, extra] = line.split('=>');
    const route = right?.trim().toLowerCase();
    if (extra !== undefined || !isR5Class(route)) {
      throw new Error(
        `Routing rule line ${index + 1} must look like "phrase | phrase => faq", with faq, policy or procedural`,
      );
    }
    const phrases = left
      .split('|')
      .map((phrase) => phrase.trim().toLowerCase())
      .filter(Boolean);
    if (phrases.length === 0) {
      throw new Error(`Routing rule line ${index + 1} has no phrase`);
    }
    rules.push({ phrases, route });
  });
  return rules;
}

/** The profile a question is sent to under the payload's router. */
export function routeFor(
  question: string,
  router: R5Router,
  docs: CorpusDoc[],
  givenClass: R5Class | null,
): R5Class {
  if (router.mode === 'given') {
    return givenClass ?? router.defaultRoute;
  }
  if (router.mode === 'rules') {
    const lower = question.toLowerCase();
    const rule = router.rules.find((candidate) =>
      candidate.phrases.some(
        (phrase) => phrase === '*' || lower.includes(phrase),
      ),
    );
    return rule?.route ?? router.defaultRoute;
  }
  if (router.mode === 'top-document') {
    const top = retrieveRanked(question, wholeDocuments(docs), 1)[0]?.chunk.meta
      ?.route;
    return isR5Class(top) ? top : router.defaultRoute;
  }
  return router.defaultRoute;
}

const documentCache = new WeakMap<CorpusDoc[], Chunk[]>();
function wholeDocuments(docs: CorpusDoc[]): Chunk[] {
  let chunks = documentCache.get(docs);
  if (!chunks) {
    chunks = chunkCorpus(docs, 400, 0, 'document');
    documentCache.set(docs, chunks);
  }
  return chunks;
}

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
  const mode = record.router ?? 'given';
  if (!R5_ROUTER_MODES.includes(mode as R5RouterMode)) {
    throw new Error('R5 router must be given, none, rules or top-document');
  }
  const defaultRoute = record.defaultRoute ?? 'policy';
  if (!isR5Class(defaultRoute)) {
    throw new Error('R5 defaultRoute must be faq, policy or procedural');
  }
  const rulesText = record.routingRules ?? '';
  if (typeof rulesText !== 'string') {
    throw new Error('R5 routingRules must be text');
  }
  return {
    faq: profile('faq'),
    policy: profile('policy'),
    procedural: profile('procedural'),
    router: {
      mode: mode as R5RouterMode,
      rules: mode === 'rules' ? parseRoutingRules(rulesText) : [],
      defaultRoute,
    },
  };
}

/** BM25 index per chunk size, so classes that share a size share it. */
function chunkCache(docs: CorpusDoc[]) {
  const cache = new Map<number, Retriever>();
  return (profile: R2Payload) => {
    const cached = cache.get(profile.chunkSize);
    if (cached) {
      return cached;
    }
    const retriever = bm25Retriever(chunkForR2(docs, profile));
    cache.set(profile.chunkSize, retriever);
    return retriever;
  };
}

/** Gold for an item: the containing sentence (or the span itself when it covers several), in its document. */
function goldFor(docs: CorpusDoc[], item: RoutedItem): Gold {
  return goldOf(docs, item.goldDocId as string, item.goldSpan as string);
}

export function routeR5(
  question: string,
  cls: R5Class,
  docs: CorpusDoc[],
  payload: R5Payload,
  chunksFor = chunkCache(docs),
) {
  const profile = payload[cls];
  const retriever = chunksFor(profile);
  const { chunks } = retriever;
  const ranked = retrieveForR2(question, retriever, profile);
  const tokens = countTokens(
    `Context:\n${ranked.map((row) => row.chunk.text).join('\n\n')}`,
  );
  return { profile, chunks, retriever, ranked, tokens };
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
      !isHiddenCanary(item.question),
  );
  const ledger = new EvalLedger();
  const perQuery: { tokens: number; chunks: number }[] = [];
  const hits: Record<R5Class, number> = { faq: 0, policy: 0, procedural: 0 };
  const totals: Record<R5Class, number> = { faq: 0, policy: 0, procedural: 0 };
  const tokens: number[] = [];
  const misses: RagGradeResult['failingCases'] = [];
  const failingQueries: TraceQuery[] = [];

  let routedRight = 0;
  for (const item of answerable) {
    const cls = item.class as R5Class;
    const routed = routeFor(item.question, payload.router, docs, cls);
    routedRight += routed === cls ? 1 : 0;
    const {
      ranked,
      retriever,
      profile,
      tokens: used,
    } = routeR5(item.question, routed, docs, payload, chunksFor);
    tokens.push(used);
    perQuery.push({ tokens: used, chunks: ranked.length });
    totals[cls] += 1;
    const gold = goldFor(docs, item);
    const hit = ranked.some((row) => holdsGold(row.chunk, gold));
    if (!hit) {
      const cause =
        routed === cls
          ? diagnoseR2Miss(item.question, retriever, profile, gold)
          : { code: `misrouted-to-${routed}` };
      // Per-class cause, e.g. "procedural:gold-split-by-chunking".
      ledger.record(item, hit, { ...cause, code: `${cls}:${cause.code}` });
    } else {
      ledger.record(item, hit);
    }
    if (hit) {
      hits[cls] += 1;
    } else if (ledger.reveal(item)) {
      misses.push({
        question: item.question,
        goldSpan: gold.text,
        retrieved: ranked.map((row) => row.chunk.text.slice(0, 220)),
        note:
          routed === cls
            ? `${cls} profile missed`
            : `${cls} question routed to the ${routed} profile`,
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
  ledger.setCost(costEvidence(perQuery, tokenCeiling));
  const tokenGate = gateResults.find(
    (gate) => gate.metric === 'mean_prompt_tokens',
  );

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
      routing_accuracy: {
        value: answerable.length === 0 ? 0 : routedRight / answerable.length,
        routed: routedRight,
        total: answerable.length,
      },
    },
    gateResults,
    // Evidence only: which class missed and why, never which knob to turn.
    failureClasses: passed
      ? []
      : [
          ...(tokenGate && !tokenGate.passed ? ['context-over-budget'] : []),
          ...ledger.topCauses(),
        ],
    scorecard: {
      recallFaq: recall('faq'),
      recallPolicy: recall('policy'),
      recallProcedural: recall('procedural'),
      meanPromptTokens: meanTokens,
      tokenCeiling,
      breakdown: ledger.breakdown(),
    },
    failingCases: misses,
    trace: {
      simulator: 'rag',
      payload,
      k: Math.max(...R5_CLASSES.map((cls) => payload[cls].topK)),
      chunkCount: chunksFor(payload.policy).chunks.length,
      tokensIn: Math.round(tokens.reduce((sum, value) => sum + value, 0)),
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...publicTraceItems(publicItems)
          .filter((item) => isR5Class(item.class))
          .map((item) => {
            const cls = item.class as R5Class;
            const route = routeFor(item.question, payload.router, docs, cls);
            const routed = routeR5(
              item.question,
              route,
              docs,
              payload,
              chunksFor,
            );
            return toTraceQuery(
              'public',
              route === cls
                ? `[${cls}] ${item.question}`
                : `[${cls} → routed ${route}] ${item.question}`,
              routed.ranked,
              {
                gold: publicGold(docs, item),
                firstStage: routed.profile.rerank
                  ? routed.retriever.rank(
                      item.question,
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
