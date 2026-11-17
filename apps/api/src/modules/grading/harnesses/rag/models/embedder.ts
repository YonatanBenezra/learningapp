import { createHash } from 'node:crypto';
import type {
  PreTrainedModel,
  PreTrainedTokenizer,
} from '@huggingface/transformers';
import {
  EMBED_MODEL,
  LruCache,
  ensurePinnedModel,
  RagModelUnavailableError,
  transformers,
} from './model-runtime';

const BATCH = 32;
const vectors = new LruCache<Float32Array>(50_000);
let loaded: Promise<{
  tokenizer: PreTrainedTokenizer;
  model: PreTrainedModel;
}> | null = null;

/** Tokenizer and encoder from the pinned local files (see ensurePinnedModel). */
function loadModel() {
  loaded ??= (async () => {
    await ensurePinnedModel(EMBED_MODEL);
    const tx = transformers();
    const [tokenizer, model] = await Promise.all([
      tx.AutoTokenizer.from_pretrained(EMBED_MODEL.id),
      tx.AutoModel.from_pretrained(EMBED_MODEL.id, {
        dtype: EMBED_MODEL.dtype,
      }),
    ]);
    return { tokenizer, model };
  })().catch((error: unknown) => {
    loaded = null;
    throw error instanceof RagModelUnavailableError
      ? error
      : new RagModelUnavailableError(EMBED_MODEL.id, error);
  });
  return loaded;
}

function keyOf(kind: 'query' | 'passage', text: string): string {
  return `${kind}:${createHash('sha1').update(text).digest('hex')}`;
}

/** bge: the [CLS] token's hidden state, L2-normalised (so dot = cosine). */
function clsVectors(hidden: {
  dims: number[];
  data: Float32Array;
}): Float32Array[] {
  const [rows, length, dims] = hidden.dims;
  const out: Float32Array[] = [];
  for (let row = 0; row < rows; row += 1) {
    const start = row * length * dims;
    const vector = hidden.data.slice(start, start + dims);
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
  kind: 'query' | 'passage',
  texts: string[],
): Promise<Float32Array[]> {
  const missing = [
    ...new Set(texts.filter((text) => !vectors.get(keyOf(kind, text)))),
  ];
  if (missing.length > 0) {
    const { tokenizer, model } = await loadModel();
    for (let start = 0; start < missing.length; start += BATCH) {
      const batch = missing.slice(start, start + BATCH);
      const inputs = tokenizer(
        kind === 'query'
          ? batch.map((text) => `${EMBED_MODEL.queryInstruction}${text}`)
          : batch,
        { padding: true, truncation: true },
      );
      const output = (await model(inputs)) as {
        last_hidden_state: { dims: number[]; data: Float32Array };
      };
      clsVectors(output.last_hidden_state).forEach((vector, row) => {
        vectors.set(keyOf(kind, batch[row]), vector);
      });
    }
  }
  return texts.map((text) => {
    const vector = vectors.get(keyOf(kind, text));
    if (!vector) {
      throw new Error('embedding cache lost a vector mid-call');
    }
    return vector;
  });
}

/** Chunk vectors. Cached per text, so the same chunk is embedded once per process. */
export function embedPassages(texts: string[]): Promise<Float32Array[]> {
  return embed('passage', texts);
}

/** Query vectors, with the model's search instruction prepended. */
export function embedQueries(texts: string[]): Promise<Float32Array[]> {
  return embed('query', texts);
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
  }
  return dot;
}
