import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import { docBody, sentencesOf } from './chunking';
import type { Chunk, CorpusDoc } from './chunking';
import type {
  EvalBreakdown,
  EvalSplit,
  HiddenItem,
  HitCount,
  PublicItem,
  TraceQuery,
} from './rag.types';
import { type Gold, holdsGold, type RankedChunk } from './retrieve';

export const FAILING_SAMPLE_LIMIT = 3;

/** Allowed question tags; content checks reject anything else. */
export const EVAL_TAGS = [
  'lexical',
  'paraphrase',
  'numeric',
  'multi-sentence',
  'unanswerable',
  'distractor',
  'id-lookup',
  'stale-version',
  'abbreviation',
  'multi-hop',
  'cross-lingual',
  'faq',
  'policy',
  'procedural',
] as const;

export function splitOf(item: { split?: unknown }): EvalSplit {
  return item.split === 'feedback' ? 'feedback' : 'holdout';
}

/**
 * Tallies hidden-set outcomes. Gates are computed by the grader on every
 * item; the ledger decides what may be revealed (feedback misses, up to the
 * sample limit) and builds the count-only breakdown for everything else.
 */
export class EvalLedger {
  private revealed = 0;
  private readonly bySplit: Record<EvalSplit, HitCount> = {
    feedback: { hits: 0, total: 0 },
    holdout: { hits: 0, total: 0 },
  };
  private readonly byTag: Record<string, HitCount> = {};
  private readonly diagnosis: Record<string, number> = {};
  private readonly goldRanks: number[] = [];
  private cost: EvalBreakdown['cost'];

  record(item: HiddenItem, hit: boolean, cause?: MissCause | null): void {
    const split = this.bySplit[splitOf(item)];
    split.total += 1;
    split.hits += hit ? 1 : 0;
    for (const tag of item.tags ?? []) {
      const row = (this.byTag[tag] ??= { hits: 0, total: 0 });
      row.total += 1;
      row.hits += hit ? 1 : 0;
    }
    if (!hit && cause) {
      this.diagnosis[cause.code] = (this.diagnosis[cause.code] ?? 0) + 1;
      if (cause.rank !== undefined) {
        this.goldRanks.push(cause.rank);
      }
    }
  }

  /** Count a cause that is not tied to one question's hit/miss (e.g. a bad citation). */
  note(code: string, count = 1): void {
    if (count > 0) {
      this.diagnosis[code] = (this.diagnosis[code] ?? 0) + count;
    }
  }

  /** May this miss be shown with its question text? Feedback split only. */
  reveal(item: HiddenItem): boolean {
    if (splitOf(item) !== 'feedback' || this.revealed >= FAILING_SAMPLE_LIMIT) {
      return false;
    }
    this.revealed += 1;
    return true;
  }

  setCost(cost: NonNullable<EvalBreakdown['cost']>): void {
    this.cost = cost;
  }

  breakdown(): EvalBreakdown {
    return {
      bySplit: this.bySplit,
      byTag: this.byTag,
      diagnosis: this.diagnosis,
      goldRanks: [...this.goldRanks].sort((a, b) => a - b),
      ...(this.cost ? { cost: this.cost } : {}),
    };
  }

  /** Miss causes, most frequent first, optionally prefixed (e.g. "policy:"). */
  topCauses(prefix = ''): string[] {
    return Object.entries(this.diagnosis)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([code]) => `${prefix}${code}`);
  }
}

export type MissCause = { code: string; rank?: number };

/**
 * Why the gold text did not reach the final top-k, read from the rankings
 * rather than guessed from the config:
 * - gold-split-by-chunking: no chunk holds the whole gold text.
 * - gold-outside-rerank-pool: the reranker never saw the gold chunk.
 * - rerank-demoted-gold: first stage had it in the top-k, the rerank pushed it out.
 * - rerank-did-not-lift-gold: it was in the pool but stayed below k.
 * - gold-ranked-below-k: no rerank, and the first stage ranked it below k.
 */
export function diagnoseRetrievalMiss(input: {
  chunks: Chunk[];
  gold: Gold;
  /** First-stage ranking over every chunk. */
  fullRanking: RankedChunk[];
  k: number;
  /** Rerank candidate pool size, or null when no rerank ran. */
  pool: number | null;
}): MissCause {
  if (!input.chunks.some((chunk) => holdsGold(chunk, input.gold))) {
    return { code: 'gold-split-by-chunking' };
  }
  const index = input.fullRanking.findIndex((row) =>
    holdsGold(row.chunk, input.gold),
  );
  const rank = index < 0 ? input.fullRanking.length + 1 : index + 1;
  if (input.pool === null) {
    return { code: 'gold-ranked-below-k', rank };
  }
  if (rank > input.pool) {
    return { code: 'gold-outside-rerank-pool', rank };
  }
  if (rank <= input.k) {
    return { code: 'rerank-demoted-gold', rank };
  }
  return { code: 'rerank-did-not-lift-gold', rank };
}

/** Mean context tokens and how they split into chunks x size. */
export function costEvidence(
  perQuery: { tokens: number; chunks: number }[],
  ceiling: number,
): NonNullable<EvalBreakdown['cost']> {
  const n = perQuery.length || 1;
  const meanTokens = perQuery.reduce((sum, row) => sum + row.tokens, 0) / n;
  const meanChunks = perQuery.reduce((sum, row) => sum + row.chunks, 0) / n;
  return {
    meanTokens,
    ceiling,
    meanChunks,
    meanTokensPerChunk: meanChunks === 0 ? 0 : meanTokens / meanChunks,
  };
}

function declaredGate(
  gates: unknown,
  metric: string,
): { value?: unknown } | undefined {
  if (!Array.isArray(gates)) {
    return undefined;
  }
  return gates.find(
    (gate: unknown): gate is { metric: string; value?: unknown } =>
      Boolean(gate) &&
      typeof gate === 'object' &&
      (gate as { metric?: unknown }).metric === metric,
  );
}

/**
 * Threshold for a grader gate, read from the exercise's declared gates
 * (meta.json -> DB) so content is the single source of truth. Falls back to
 * the archetype default when the exercise does not declare that gate.
 */
export function gateThreshold(
  gates: unknown,
  metric: string,
  fallback: number,
): number {
  const value = declaredGate(gates, metric)?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** True when the exercise declares this gate; optional gates only apply then. */
export function declaresGate(gates: unknown, metric: string): boolean {
  return declaredGate(gates, metric) !== undefined;
}

export function answerableHidden(hidden: HiddenItem[]): HiddenItem[] {
  return hidden.filter(
    (item) =>
      item.answerable &&
      Boolean(item.goldSpan) &&
      Boolean(item.goldDocId) &&
      !isHiddenCanary(item.question),
  );
}

export function publicTraceItems<T extends { question: string }>(
  publicItems: T[],
): T[] {
  return publicItems.filter((item) => !isHiddenCanary(item.question));
}

export type TraceExtras = {
  /** Expanded gold sentence. Pass it for PUBLIC queries only, never hidden ones. */
  gold?: Gold | null;
  /** Ranking before the rerank/boost step, to show how ranks moved. */
  firstStage?: RankedChunk[] | null;
  contextTokens?: number;
};

export function toTraceQuery(
  source: TraceQuery['source'],
  question: string,
  ranked: RankedChunk[],
  extras: TraceExtras = {},
): TraceQuery {
  const gold = source === 'public' ? (extras.gold ?? null) : null;
  const firstStageIds = extras.firstStage?.map((row) => row.chunk.id) ?? null;
  const retrieved = ranked.map((row) => {
    const firstIndex = firstStageIds?.indexOf(row.chunk.id) ?? -1;
    return {
      chunkId: row.chunk.id,
      docId: row.chunk.docId,
      score: row.score,
      text: row.chunk.text.slice(0, 400),
      ...(gold ? { goldHit: holdsGold(row.chunk, gold) } : {}),
      ...(firstStageIds
        ? { firstStageRank: firstIndex < 0 ? null : firstIndex + 1 }
        : {}),
    };
  });
  return {
    source,
    question,
    ...(gold ? { hit: retrieved.some((row) => row.goldHit === true) } : {}),
    ...(extras.contextTokens !== undefined
      ? { contextTokens: extras.contextTokens }
      : {}),
    retrieved,
  };
}

/** Expanded gold sentence for a public sample, or null when it has none. */
export function publicGold(docs: CorpusDoc[], item: PublicItem): Gold | null {
  return item.goldDocId && item.goldSpan
    ? goldOf(docs, item.goldDocId, item.goldSpan)
    : null;
}

/** The gold sentence for a span, tied to its document. */
export function goldOf(docs: CorpusDoc[], docId: string, span: string): Gold {
  return { docId, text: expandGoldSpan(docs, docId, span) };
}

export function expandGoldSpan(
  docs: CorpusDoc[],
  docId: string,
  goldSpan: string,
): string {
  const doc = docs.find((item) => item.id === docId);
  if (!doc) {
    return goldSpan;
  }
  const sentence = sentencesOf(docBody(doc)).find((part) =>
    part.includes(goldSpan),
  );
  return sentence ?? goldSpan;
}

export function goldSpanOverlap(chunkText: string, goldSpan: string): number {
  const chunk = normalize(chunkText);
  const gold = normalize(goldSpan);
  if (!gold) {
    return 0;
  }
  if (chunk.includes(gold)) {
    return 1;
  }
  const tokens = gold.split(' ').filter((token) => token.length > 1);
  if (tokens.length === 0) {
    return 0;
  }
  const hits = tokens.filter((token) => chunk.includes(token)).length;
  return hits / tokens.length;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Runs `task` over `items` with at most `limit` in flight, keeping order. */
export async function mapLimited<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await task(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
