import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type * as Transformers from '@huggingface/transformers';

export type PinnedModel = {
  id: string;
  /** Hugging Face commit; the files are downloaded from exactly this commit. */
  revision: string;
  dtype: 'q8';
};

/**
 * Pinned open models for the RAG engine, run locally on CPU with ONNX (int8).
 * Changing either one changes grades: bump it on purpose and re-run the
 * content checks.
 */
/** An embedding model and how it wants its inputs pooled and prefixed. */
export type EmbedModel = PinnedModel & {
  /** Short name used in labels and cache keys. */
  name: string;
  pooling: 'cls' | 'mean';
  queryPrefix: string;
  passagePrefix: string;
};

/** English: bge-small, CLS pooling, a search instruction on queries. */
export const EMBED_MODEL = {
  id: 'Xenova/bge-small-en-v1.5',
  revision: 'ea104dacec62c0de699686887e3f920caeb4f3e3',
  dtype: 'q8',
  name: 'bge-small',
  pooling: 'cls',
  queryPrefix: 'Represent this sentence for searching relevant passages: ',
  passagePrefix: '',
} as const satisfies EmbedModel;

/**
 * Multilingual (about 100 languages, Bangla included): e5-small, mean pooling,
 * "query: " / "passage: " prefixes. Questions in one language find passages
 * in another.
 */
export const MULTILINGUAL_EMBED_MODEL = {
  id: 'Xenova/multilingual-e5-small',
  revision: '761b726dd34fb83930e26aab4e9ac3899aa1fa78',
  dtype: 'q8',
  name: 'multilingual-e5-small',
  pooling: 'mean',
  queryPrefix: 'query: ',
  passagePrefix: 'passage: ',
} as const satisfies EmbedModel;

export const RERANK_MODEL = {
  id: 'Xenova/ms-marco-MiniLM-L-6-v2',
  revision: 'a09144355adeed5f58c8ed011d209bf8ee5a1fec',
  dtype: 'q8',
} as const satisfies PinnedModel;

/**
 * Guardrails (G3) input classifier: a multilingual prompt-injection detector
 * (mmBERT-small, labels SAFE / INJECTION, Apache-2.0). Learners set the
 * threshold; the score itself never changes for a given text.
 */
export const INJECTION_MODEL = {
  id: 'Horizon-Labs/prompt-injection-guard-small',
  revision: '2efc2ed5abecd21eb45c2506d231a65d6e392b85',
  dtype: 'q8',
} as const satisfies PinnedModel;

/** What transformers.js reads for a q8 encoder: config, tokenizer, weights. */
export const MODEL_FILES = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/model_quantized.onnx',
] as const;

/** Thrown when a model is needed but is neither cached nor downloadable. */
export class RagModelUnavailableError extends Error {
  constructor(model: string, cause: unknown) {
    super(
      `RAG model ${model} is not available: ${cause instanceof Error ? cause.message : String(cause)}. ` +
        'Run `npm run models:fetch -w @labpath/api`, or allow downloads (RAG_MODELS_ALLOW_DOWNLOAD=true).',
    );
    this.name = 'RagModelUnavailableError';
  }
}

export function modelCacheDir(): string {
  const configured = process.env.RAG_MODEL_CACHE_DIR?.trim();
  return configured
    ? path.resolve(configured)
    : path.join(process.cwd(), '.cache', 'models');
}

let runtime: typeof Transformers | null = null;

/**
 * transformers.js, loaded on first use: it pulls in onnxruntime, which API
 * routes and specs that never touch dense retrieval should not pay for. It
 * only ever reads local files; see ensurePinnedModel for why.
 */
export function transformers(): typeof Transformers {
  if (runtime) {
    return runtime;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded = require('@huggingface/transformers') as typeof Transformers;
  loaded.env.allowRemoteModels = false;
  loaded.env.allowLocalModels = true;
  loaded.env.localModelPath = modelCacheDir();
  loaded.env.useFSCache = false;
  runtime = loaded;
  return loaded;
}

const REVISION_MARKER = '.revision';
const ensured = new Map<string, Promise<void>>();

/**
 * Makes sure the pinned commit's files are in <cache>/<org>/<name>/,
 * downloading them by commit when allowed. transformers.js then loads them as
 * local files: its own downloader checks some files at the `main` revision,
 * which would quietly break the pin (and fails offline).
 */
export function ensurePinnedModel(model: PinnedModel): Promise<void> {
  const key = `${model.id}@${model.revision}`;
  let pending = ensured.get(key);
  if (!pending) {
    pending = downloadPinned(model).catch((error: unknown) => {
      ensured.delete(key);
      throw new RagModelUnavailableError(model.id, error);
    });
    ensured.set(key, pending);
  }
  return pending;
}

async function downloadPinned(model: PinnedModel): Promise<void> {
  const dir = path.join(modelCacheDir(), model.id);
  const marker = path.join(dir, REVISION_MARKER);
  const current = (await readFile(marker, 'utf8').catch(() => '')).trim();
  if (current === model.revision) {
    return;
  }
  if (process.env.RAG_MODELS_ALLOW_DOWNLOAD === 'false') {
    throw new Error(
      current
        ? `the cache holds revision ${current.slice(0, 8)}, not the pinned ${model.revision.slice(0, 8)}`
        : 'it is not in the model cache and downloads are off',
    );
  }
  for (const file of MODEL_FILES) {
    const url = `https://huggingface.co/${model.id}/resolve/${model.revision}/${file}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`download failed (${response.status}) for ${url}`);
    }
    const target = path.join(dir, file);
    await mkdir(path.dirname(target), { recursive: true });
    const partial = `${target}.${process.pid}.part`;
    await writeFile(partial, Buffer.from(await response.arrayBuffer()));
    await rename(partial, target);
  }
  await writeFile(marker, `${model.revision}\n`);
}

/** Bounded memo: oldest entries go first once `limit` is reached. */
export class LruCache<V> {
  private readonly map = new Map<string, V>();

  constructor(private readonly limit: number) {}

  get(key: string): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: string, value: V): void {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.limit) {
      for (const oldest of this.map.keys()) {
        this.map.delete(oldest);
        break;
      }
    }
  }
}

/** Rounds model scores so tiny float differences between CPUs never reorder ties. */
export function stableScore(value: number, digits = 6): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
