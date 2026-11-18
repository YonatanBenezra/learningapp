#!/usr/bin/env node
/**
 * Downloads the pinned RAG engine models (embedding + cross-encoder reranker)
 * into RAG_MODEL_CACHE_DIR (default apps/api/.cache/models), by commit, and
 * runs each once. A deploy can then set RAG_MODELS_ALLOW_DOWNLOAD=false.
 *
 * Mirrors ensurePinnedModel in src/modules/grading/harnesses/rag/models/
 * model-runtime.ts, which is also where the ids and commits are pinned (this
 * script reads them from there, so there is one place to change).
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);
const runtimeTs = path.join(
  apiRoot,
  'src/modules/grading/harnesses/rag/models/model-runtime.ts',
);
const source = await readFile(runtimeTs, 'utf8');

function pinned(name) {
  const block = source.slice(source.indexOf(`export const ${name} = {`));
  const field = (key) => block.match(new RegExp(`${key}: '([^']+)'`))?.[1];
  const model = {
    id: field('id'),
    revision: field('revision'),
    dtype: field('dtype'),
  };
  if (!model.id || !model.revision || !model.dtype) {
    throw new Error(`Could not read ${name} from ${runtimeTs}`);
  }
  return model;
}

const files = [
  ...source
    .slice(source.indexOf('export const MODEL_FILES = ['))
    .split(']')[0]
    .matchAll(/'([^']+)'/g),
].map((match) => match[1]);

const cacheDir = process.env.RAG_MODEL_CACHE_DIR?.trim()
  ? path.resolve(process.env.RAG_MODEL_CACHE_DIR)
  : path.join(apiRoot, '.cache', 'models');

async function fetchPinned(model) {
  const dir = path.join(cacheDir, model.id);
  const marker = path.join(dir, '.revision');
  const current = (await readFile(marker, 'utf8').catch(() => '')).trim();
  if (current === model.revision) {
    return 'cached';
  }
  for (const file of files) {
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
  return 'downloaded';
}

const started = Date.now();
const embedders = [pinned('EMBED_MODEL'), pinned('MULTILINGUAL_EMBED_MODEL')];
const rerank = pinned('RERANK_MODEL');
const embedStates = [];
for (const model of embedders) {
  embedStates.push(await fetchPinned(model));
}
const rerankState = await fetchPinned(rerank);

// Load every model exactly as the engine does: local files only.
const tx = require('@huggingface/transformers');
tx.env.allowRemoteModels = false;
tx.env.allowLocalModels = true;
tx.env.localModelPath = cacheDir;
tx.env.useFSCache = false;

for (const [index, model] of embedders.entries()) {
  const tokenizer = await tx.AutoTokenizer.from_pretrained(model.id);
  const encoder = await tx.AutoModel.from_pretrained(model.id, {
    dtype: model.dtype,
  });
  const { last_hidden_state: hidden } = await encoder(
    tokenizer(['warm-up'], { padding: true, truncation: true }),
  );
  console.log(
    `${model.id}@${model.revision.slice(0, 8)} (${embedStates[index]}): ${hidden.dims[2]} dims`,
  );
}

const rerankTokenizer = await tx.AutoTokenizer.from_pretrained(rerank.id);
const rerankModel = await tx.AutoModelForSequenceClassification.from_pretrained(
  rerank.id,
  {
    dtype: rerank.dtype,
  },
);
const { logits } = await rerankModel(
  rerankTokenizer(['warm-up'], { text_pair: ['warm-up'] }),
);
console.log(
  `${rerank.id}@${rerank.revision.slice(0, 8)} (${rerankState}): score ${logits.data[0].toFixed(2)}`,
);
console.log(`models in ${cacheDir} (${Date.now() - started} ms)`);
