import { createHash } from 'node:crypto';
import type {
  PreTrainedModel,
  PreTrainedTokenizer,
} from '@huggingface/transformers';
import {
  ensurePinnedModel,
  LruCache,
  RagModelUnavailableError,
  RERANK_MODEL,
  stableScore,
  transformers,
} from './model-runtime';

const BATCH = 16;
const scores = new LruCache<number>(200_000);
let loaded: Promise<{
  tokenizer: PreTrainedTokenizer;
  model: PreTrainedModel;
}> | null = null;

function loadModel() {
  loaded ??= (async () => {
    await ensurePinnedModel(RERANK_MODEL);
    const tx = transformers();
    const [tokenizer, model] = await Promise.all([
      tx.AutoTokenizer.from_pretrained(RERANK_MODEL.id),
      tx.AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL.id, {
        dtype: RERANK_MODEL.dtype,
      }),
    ]);
    return { tokenizer, model };
  })().catch((error: unknown) => {
    loaded = null;
    throw error instanceof RagModelUnavailableError
      ? error
      : new RagModelUnavailableError(RERANK_MODEL.id, error);
  });
  return loaded;
}

const hash = (text: string) =>
  createHash('sha1').update(text).digest('hex').slice(0, 20);

/**
 * Relevance of each passage to the query, from a cross-encoder that reads the
 * (query, passage) pair together. Higher is more relevant; the scale is raw
 * logits (roughly -11 to +11), so only the order is meaningful.
 */
export async function crossEncoderScores(
  query: string,
  passages: string[],
): Promise<number[]> {
  const queryKey = hash(query);
  const keyOf = (passage: string) => `${queryKey}:${hash(passage)}`;
  const missing = [
    ...new Set(
      passages.filter((passage) => scores.get(keyOf(passage)) === undefined),
    ),
  ];
  if (missing.length > 0) {
    const { tokenizer, model } = await loadModel();
    for (let start = 0; start < missing.length; start += BATCH) {
      const batch = missing.slice(start, start + BATCH);
      const inputs = tokenizer(
        batch.map(() => query),
        { text_pair: batch, padding: true, truncation: true },
      );
      const output = (await model(inputs)) as {
        logits: { data: Float32Array };
      };
      batch.forEach((passage, row) => {
        scores.set(keyOf(passage), stableScore(output.logits.data[row], 4));
      });
    }
  }
  return passages.map((passage) => scores.get(keyOf(passage)) as number);
}
