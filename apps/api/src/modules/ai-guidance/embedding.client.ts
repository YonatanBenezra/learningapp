import { env } from '../../config/env';
import { AI_CONFIG } from './ai.config';

const OPENROUTER_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';

export interface EmbeddingBatchResult {
  vectors: number[][];
  model: string;
  provider: 'openrouter' | 'local';
  dimensions: number;
  fallback: boolean;
  fallbackReason?: 'no_api_key' | 'provider_error' | 'invalid_response';
  fallbackMessage?: string;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.openRouterApiKey}`,
    'Content-Type': 'application/json',
  };
  if (env.openRouterAppUrl) headers['HTTP-Referer'] = env.openRouterAppUrl;
  if (env.openRouterAppName) headers['X-Title'] = env.openRouterAppName;
  return headers;
}

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector;
  return vector.map((value) => value / magnitude);
}

/** Deterministic local vectors — used in tests or when no API key is configured. */
export function localEmbedTexts(texts: string[], dimensions = 64): EmbeddingBatchResult {
  const vectors = texts.map((text) => {
    const vector = new Array(dimensions).fill(0);
    for (const token of tokenize(text)) {
      const index = hashToken(token) % dimensions;
      vector[index] += 1;
    }
    for (const token of tokenize(text)) {
      if (token.includes('hallucin') || token.includes('ground')) {
        vector[0] += 2.5;
      }
      if (token.includes('cosine') || token.includes('similarity') || token.includes('embedding')) {
        vector[1] += 2.5;
      }
      if (token.includes('chunk') || token.includes('split') || token.includes('overlap')) {
        vector[2] += 2.5;
      }
    }
    return normalize(vector);
  });

  return {
    vectors,
    model: 'local-hash-embedding',
    provider: 'local',
    dimensions,
    fallback: false,
  };
}

function localFallback(
  texts: string[],
  reason: NonNullable<EmbeddingBatchResult['fallbackReason']>,
  message?: string,
): EmbeddingBatchResult {
  return {
    ...localEmbedTexts(texts),
    fallback: true,
    fallbackReason: reason,
    fallbackMessage: message,
  };
}

export async function embedTexts(texts: string[]): Promise<EmbeddingBatchResult> {
  if (!texts.length) {
    return {
      vectors: [],
      model: 'local-hash-embedding',
      provider: 'local',
      dimensions: 0,
      fallback: false,
    };
  }

  if (!env.openRouterApiKey) {
    return {
      ...localEmbedTexts(texts),
      fallbackReason: 'no_api_key',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

  try {
    const res = await fetch(OPENROUTER_EMBEDDINGS_URL, {
      method: 'POST',
      headers: buildHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        model: AI_CONFIG.embeddingModel,
        input: texts,
      }),
    });

    const body = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>;
      model?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = body.error?.message ?? res.statusText ?? 'Embedding request failed';
      return localFallback(texts, 'provider_error', message);
    }

    const vectors = (body.data ?? []).map((row) => row.embedding ?? []);
    if (vectors.length !== texts.length || vectors.some((vector) => vector.length === 0)) {
      return localFallback(texts, 'invalid_response', 'Embedding response was incomplete.');
    }

    return {
      vectors,
      model: body.model ?? AI_CONFIG.embeddingModel,
      provider: 'openrouter',
      dimensions: vectors[0]?.length ?? 0,
      fallback: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Embedding request failed';
    return localFallback(texts, 'provider_error', message);
  } finally {
    clearTimeout(timer);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function cosineToScore(similarity: number): number {
  return Math.max(0, Math.min(100, Math.round(Math.max(0, similarity) * 100)));
}
