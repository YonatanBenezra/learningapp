import { createHash } from 'node:crypto';
import type {
  PreTrainedModel,
  PreTrainedTokenizer,
} from '@huggingface/transformers';
import {
  ensurePinnedModel,
  INJECTION_MODEL,
  LruCache,
  RagModelUnavailableError,
  stableScore,
  transformers,
} from '../rag/models/model-runtime';

/**
 * The G3 input classifier: a pinned, local prompt-injection model run on CPU.
 * It returns P(injection) in [0, 1], rounded so tiny float differences
 * between machines never flip a threshold. Learners only pick the threshold.
 */
const BATCH = 16;
const MAX_TOKENS = 256;
const scores = new LruCache<number>(100_000);
let loaded: Promise<{
  tokenizer: PreTrainedTokenizer;
  model: PreTrainedModel;
}> | null = null;

function loadModel() {
  loaded ??= (async () => {
    await ensurePinnedModel(INJECTION_MODEL);
    const tx = transformers();
    const [tokenizer, model] = await Promise.all([
      tx.AutoTokenizer.from_pretrained(INJECTION_MODEL.id),
      tx.AutoModelForSequenceClassification.from_pretrained(
        INJECTION_MODEL.id,
        { dtype: INJECTION_MODEL.dtype },
      ),
    ]);
    return { tokenizer, model };
  })().catch((error: unknown) => {
    loaded = null;
    throw error instanceof RagModelUnavailableError
      ? error
      : new RagModelUnavailableError(INJECTION_MODEL.id, error);
  });
  return loaded;
}

const keyOf = (text: string) =>
  createHash('sha1').update(text).digest('hex').slice(0, 24);

/** Injection probability for each text (same order). */
export async function injectionScores(texts: string[]): Promise<number[]> {
  const missing = [
    ...new Set(texts.filter((text) => scores.get(keyOf(text)) === undefined)),
  ];
  if (missing.length > 0) {
    const { tokenizer, model } = await loadModel();
    for (let start = 0; start < missing.length; start += BATCH) {
      const batch = missing.slice(start, start + BATCH);
      const inputs = tokenizer(batch, {
        padding: true,
        truncation: true,
        max_length: MAX_TOKENS,
      });
      const { logits } = (await model(inputs)) as {
        logits: { tolist: () => number[][] };
      };
      logits.tolist().forEach(([safe, injection], index) => {
        const p = 1 / (1 + Math.exp(safe - injection));
        scores.set(keyOf(batch[index]), stableScore(p, 3));
      });
    }
  }
  return texts.map((text) => scores.get(keyOf(text)) ?? 0);
}

export const INJECTION_MODEL_LABEL = `${INJECTION_MODEL.id}@${INJECTION_MODEL.revision.slice(0, 8)}`;
