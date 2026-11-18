import { createHash } from 'node:crypto';
import type {
  PreTrainedModel,
  PreTrainedTokenizer,
} from '@huggingface/transformers';
import {
  EMBED_MODEL,
  type EmbedModel,
  ensurePinnedModel,
  LruCache,
  RagModelUnavailableError,
  transformers,
} from './model-runtime';

const BATCH = 32;
const vectors = new LruCache<Float32Array>(50_000);
const loaded = new Map<
  string,
  Promise<{ tokenizer: PreTrainedTokenizer; model: PreTrainedModel }>
>();

/** Tokenizer and encoder from the pinned local files (see ensurePinnedModel). */
function loadModel(spec: EmbedModel) {
  let pending = loaded.get(spec.id);
  if (!pending) {
    pending = (async () => {
      await ensurePinnedModel(spec);
      const tx = transformers();
      const [tokenizer, model] = await Promise.all([
        tx.AutoTokenizer.from_pretrained(spec.id),
        tx.AutoModel.from_pretrained(spec.id, { dtype: spec.dtype }),
      ]);
      return { tokenizer, model };
    })().catch((error: unknown) => {
      loaded.delete(spec.id);
      throw error instanceof RagModelUnavailableError
        ? error
        : new RagModelUnavailableError(spec.id, error);
    });
    loaded.set(spec.id, pending);
  }
  return pending;
}

function keyOf(
  spec: EmbedModel,
  kind: 'query' | 'passage',
  text: string,
): string {
  return `${spec.name}:${kind}:${createHash('sha1').update(text).digest('hex')}`;
}

/** Pooled, L2-normalised vectors (so a dot product is the cosine). */
function pool(
  hidden: { dims: number[]; data: Float32Array },
  mask: { data: ArrayLike<number | bigint> },
  pooling: EmbedModel['pooling'],
): Float32Array[] {
  const [rows, length, dims] = hidden.dims;
  const out: Float32Array[] = [];
  for (let row = 0; row < rows; row += 1) {
    const vector = new Float32Array(dims);
    if (pooling === 'cls') {
      vector.set(
        hidden.data.subarray(row * length * dims, row * length * dims + dims),
      );
    } else {
      let count = 0;
      for (let position = 0; position < length; position += 1) {
        if (Number(mask.data[row * length + position]) === 0) {
          continue;
        }
        count += 1;
        const start = (row * length + position) * dims;
        for (let i = 0; i < dims; i += 1) {
          vector[i] += hidden.data[start + i];
        }
      }
      for (let i = 0; i < dims; i += 1) {
        vector[i] /= count || 1;
      }
    }
    let norm = 0;
    for (const value of vector) {
      norm += value * value;
    }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < dims; i += 1) {
      vector[i] /= norm;
    }
    out.push(vector);
  }
  return out;
}

async function embed(
  spec: EmbedModel,
  kind: 'query' | 'passage',
  texts: string[],
): Promise<Float32Array[]> {
  const missing = [
    ...new Set(texts.filter((text) => !vectors.get(keyOf(spec, kind, text)))),
  ];
  if (missing.length > 0) {
    const { tokenizer, model } = await loadModel(spec);
    const prefix = kind === 'query' ? spec.queryPrefix : spec.passagePrefix;
    for (let start = 0; start < missing.length; start += BATCH) {
      const batch = missing.slice(start, start + BATCH);
      const inputs = tokenizer(
        batch.map((text) => `${prefix}${text}`),
        { padding: true, truncation: true },
      ) as { attention_mask: { data: ArrayLike<number | bigint> } };
      const output = (await model(inputs)) as {
        last_hidden_state: { dims: number[]; data: Float32Array };
      };
      pool(
        output.last_hidden_state,
        inputs.attention_mask,
        spec.pooling,
      ).forEach((vector, row) => {
        vectors.set(keyOf(spec, kind, batch[row]), vector);
      });
    }
  }
  return texts.map((text) => {
    const vector = vectors.get(keyOf(spec, kind, text));
    if (!vector) {
      throw new Error('embedding cache lost a vector mid-call');
    }
    return vector;
  });
}

/** Chunk vectors. Cached per model and text, so a chunk is embedded once per process. */
export function embedPassages(
  texts: string[],
  spec: EmbedModel = EMBED_MODEL,
): Promise<Float32Array[]> {
  return embed(spec, 'passage', texts);
}

/** Query vectors, with the model's query prefix. */
export function embedQueries(
  texts: string[],
  spec: EmbedModel = EMBED_MODEL,
): Promise<Float32Array[]> {
  return embed(spec, 'query', texts);
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
  }
  return dot;
}
