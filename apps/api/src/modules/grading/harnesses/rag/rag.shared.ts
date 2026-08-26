import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import type { CorpusDoc } from './chunking';
import type { HiddenItem, TraceQuery } from './rag.types';
import type { RankedChunk } from './retrieve';

export const FAILING_SAMPLE_LIMIT = 3;

export function answerableHidden(hidden: HiddenItem[]): HiddenItem[] {
  return hidden.filter(
    (item) =>
      item.answerable &&
      Boolean(item.goldSpan) &&
      Boolean(item.goldDocId) &&
      !isHiddenCanary(item.question),
  );
}

export function publicTraceItems(
  publicItems: { question: string }[],
): { question: string }[] {
  return publicItems.filter((item) => !isHiddenCanary(item.question));
}

export function toTraceQuery(
  source: TraceQuery['source'],
  question: string,
  ranked: RankedChunk[],
): TraceQuery {
  return {
    source,
    question,
    retrieved: ranked.map((row) => ({
      chunkId: row.chunk.id,
      docId: row.chunk.docId,
      score: row.score,
      text: row.chunk.text.slice(0, 400),
    })),
  };
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
