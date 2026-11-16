import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from './chunking';
import type { HiddenItem, PublicItem, TraceQuery } from './rag.types';
import { chunkContainsSpan, type RankedChunk } from './retrieve';

export const FAILING_SAMPLE_LIMIT = 3;

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
  gold?: string | null;
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
      ...(gold ? { goldHit: chunkContainsSpan(row.chunk.text, gold) } : {}),
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
export function publicGold(docs: CorpusDoc[], item: PublicItem): string | null {
  return item.goldDocId && item.goldSpan
    ? expandGoldSpan(docs, item.goldDocId, item.goldSpan)
    : null;
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
  const body = `${doc.title}. ${doc.text}`;
  const sentence = body
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .find((part) => part.includes(goldSpan));
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
