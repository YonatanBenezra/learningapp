import type {
  DedupeMode,
  R2Payload,
  R3Payload,
  R4Payload,
  RagPayload,
  RerankerKind,
  FilterStage,
  RetrievalMode,
  SplitStrategy,
  StatusFilter,
} from './rag.types';

const SPLIT_STRATEGIES: SplitStrategy[] = [
  'fixed',
  'sentence',
  'recursive',
  'heading-aware',
];

const RERANKERS: RerankerKind[] = [
  'none',
  'title-boost',
  'mmr',
  'cross-encoder',
];

const RETRIEVAL_MODES: RetrievalMode[] = ['bm25', 'dense', 'hybrid'];
const STATUS_FILTERS: StatusFilter[] = [
  'none',
  'exclude-superseded',
  'current-only',
];
const FILTER_STAGES: FilterStage[] = ['pre', 'post'];
const DEDUPE_MODES: DedupeMode[] = ['none', 'exact', 'near'];

export function parseR1Payload(payload: unknown): RagPayload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('RAG payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  const chunkSize = record.chunkSize;
  const overlap = record.overlap;
  const splitStrategy = record.splitStrategy;
  if (typeof chunkSize !== 'number' || typeof overlap !== 'number') {
    throw new Error('RAG payload is missing chunkSize or overlap');
  }
  if (
    typeof splitStrategy !== 'string' ||
    !SPLIT_STRATEGIES.includes(splitStrategy as SplitStrategy)
  ) {
    throw new Error('RAG payload has an invalid splitStrategy');
  }
  return {
    chunkSize,
    overlap,
    splitStrategy: splitStrategy as SplitStrategy,
  };
}

/** Chunk size when an R2 exercise does not offer it as a knob. */
export const R2_DEFAULT_CHUNK_SIZE = 400;

export function parseR2Payload(payload: unknown): R2Payload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('R2 payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  // Exercises that lock rerank or chunk size leave them out of the schema.
  const rerank = record.rerank ?? false;
  const chunkSize = record.chunkSize ?? R2_DEFAULT_CHUNK_SIZE;
  if (
    typeof record.topK !== 'number' ||
    typeof rerank !== 'boolean' ||
    typeof chunkSize !== 'number'
  ) {
    throw new Error('R2 payload is missing topK, rerank, or chunkSize');
  }
  const mode = record.retrievalMode;
  if (mode !== undefined && !RETRIEVAL_MODES.includes(mode as RetrievalMode)) {
    throw new Error('R2 payload has an invalid retrievalMode');
  }
  const alpha = record.hybridAlpha;
  if (
    alpha !== undefined &&
    (typeof alpha !== 'number' || !(alpha >= 0 && alpha <= 1))
  ) {
    throw new Error('R2 hybridAlpha must be a number from 0 to 1');
  }
  return {
    topK: record.topK,
    rerank,
    chunkSize,
    ...(mode !== undefined ? { retrievalMode: mode as RetrievalMode } : {}),
    ...(alpha !== undefined ? { hybridAlpha: alpha } : {}),
    ...optionalEnum(record, 'statusFilter', STATUS_FILTERS),
    ...optionalEnum(record, 'filterStage', FILTER_STAGES),
    ...optionalEnum(record, 'dedupe', DEDUPE_MODES),
    ...unitInterval(record, 'dedupeThreshold'),
  };
}

/** `{ [key]: value }` for a number from 0 to 1, `{}` when absent. */
function unitInterval(
  record: Record<string, unknown>,
  key: string,
): Record<string, number> {
  const value = record[key];
  if (value === undefined) {
    return {};
  }
  if (typeof value !== 'number' || !(value >= 0 && value <= 1)) {
    throw new Error(`R2 ${key} must be a number from 0 to 1`);
  }
  return { [key]: value };
}

/** `{ [key]: value }` when the payload sets an allowed value, `{}` when absent. */
function optionalEnum<K extends string, V extends string>(
  record: Record<string, unknown>,
  key: K,
  allowed: readonly V[],
): Partial<Record<K, V>> {
  const value = record[key];
  if (value === undefined) {
    return {};
  }
  if (typeof value !== 'string' || !allowed.includes(value as V)) {
    throw new Error(`R2 payload has an invalid ${key}`);
  }
  return { [key]: value } as Partial<Record<K, V>>;
}

export function parseR3Payload(payload: unknown): R3Payload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('R3 payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.generationPrompt !== 'string') {
    throw new Error('R3 payload is missing generationPrompt');
  }
  return { generationPrompt: record.generationPrompt };
}

export function parseR4Payload(payload: unknown): R4Payload {
  if (payload === null || typeof payload !== 'object') {
    throw new Error('R4 payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  const reranker = record.reranker;
  const rerankTopN = record.rerankTopN;
  const queryRewritePrompt = record.queryRewritePrompt ?? '';
  if (
    typeof reranker !== 'string' ||
    !RERANKERS.includes(reranker as RerankerKind)
  ) {
    throw new Error('R4 payload has an invalid reranker');
  }
  if (typeof rerankTopN !== 'number') {
    throw new Error('R4 payload is missing rerankTopN');
  }
  if (typeof queryRewritePrompt !== 'string') {
    throw new Error('R4 queryRewritePrompt must be a string');
  }
  return {
    reranker: reranker as RerankerKind,
    rerankTopN,
    queryRewritePrompt,
  };
}

export const parseRagPayload = parseR1Payload;
