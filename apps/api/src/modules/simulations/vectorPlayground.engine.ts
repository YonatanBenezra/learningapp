import type { VectorPlaygroundRunResult, SimulationSubmitResult } from './simulation.types';

export interface VectorChunk {
  id: string;
  source: string;
  text: string;
  keywords: string[];
}

export const VECTOR_PLAYGROUND_CHUNKS: VectorChunk[] = [
  {
    id: 'chunk-rag-basics',
    source: 'RAG handbook · §1',
    text: 'Retrieval-Augmented Generation combines a retriever with an LLM so answers can cite external documents.',
    keywords: ['rag', 'retrieval', 'llm', 'documents', 'augmented'],
  },
  {
    id: 'chunk-hallucination',
    source: 'RAG handbook · §4',
    text: 'Ground responses with retrieved passages and instruct the model to stay within provided context to reduce hallucinations.',
    keywords: ['hallucination', 'grounding', 'retrieved', 'context', 'rag', 'reduce'],
  },
  {
    id: 'chunk-chunking',
    source: 'Indexing notes · §2',
    text: 'Split long documents into overlapping chunks so embeddings capture local semantics without exceeding context limits.',
    keywords: ['chunk', 'split', 'embedding', 'context', 'overlap'],
  },
  {
    id: 'chunk-cosine',
    source: 'Embeddings 101',
    text: 'Cosine similarity compares vector direction, making it common for semantic search over embedding indexes.',
    keywords: ['cosine', 'similarity', 'embedding', 'semantic', 'search', 'vector'],
  },
  {
    id: 'chunk-finetune',
    source: 'LLM training primer',
    text: 'Fine-tuning updates model weights on labeled examples, which is distinct from retrieval at inference time.',
    keywords: ['fine', 'tuning', 'weights', 'training', 'labeled'],
  },
];

const DEFAULT_QUERY =
  'How can I reduce hallucinations when building a RAG assistant?';

export const DEFAULT_VECTOR_QUERY = DEFAULT_QUERY;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

function scoreChunk(query: string, chunk: VectorChunk): number {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return 0;

  const chunkTokens = tokenize(`${chunk.text} ${chunk.keywords.join(' ')}`);
  let overlap = 0;
  for (const token of queryTokens) {
    if (chunkTokens.has(token)) overlap += 1;
  }

  let keywordBonus = 0;
  for (const keyword of chunk.keywords) {
    if (query.toLowerCase().includes(keyword)) keywordBonus += 8;
  }

  const base = (overlap / queryTokens.size) * 72;
  return Math.max(0, Math.min(100, Math.round(base + keywordBonus)));
}

function expectedBestChunkId(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('hallucin') || (q.includes('rag') && q.includes('reduce'))) {
    return 'chunk-hallucination';
  }
  if (q.includes('cosine') || q.includes('similarity') || q.includes('embedding')) {
    return 'chunk-cosine';
  }
  if (q.includes('chunk') || q.includes('split')) {
    return 'chunk-chunking';
  }
  return 'chunk-rag-basics';
}

export function runVectorPlayground(query: string, topK = 3): VectorPlaygroundRunResult {
  const k = Math.min(5, Math.max(1, topK));
  const matches = VECTOR_PLAYGROUND_CHUNKS.map((chunk) => ({
    id: chunk.id,
    source: chunk.source,
    text: chunk.text,
    score: scoreChunk(query, chunk),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  const hints: string[] = [];
  if (matches[0]?.score < 45) {
    hints.push('Try query words like "hallucination", "RAG", or "grounding".');
  }
  if (matches.length > 1 && matches[0].score - matches[1].score < 8) {
    hints.push('Top scores are close — compare whether the chunk mentions grounding vs generic RAG.');
  }

  return { matches, hints, defaultQuery: DEFAULT_QUERY };
}

export function submitVectorPlayground(
  query: string,
  selectedChunkId: string,
): SimulationSubmitResult {
  const expectedId = expectedBestChunkId(query);
  const passed = selectedChunkId === expectedId;
  const top = runVectorPlayground(query, 1).matches[0];
  const score = passed ? Math.max(top?.score ?? 70, 85) : Math.max(20, (top?.score ?? 0) - 15);

  const expectedChunk = VECTOR_PLAYGROUND_CHUNKS.find((c) => c.id === expectedId);
  const feedback = passed
    ? 'Correct chunk. It explicitly mentions grounding retrieved context to reduce hallucinations.'
    : `Not the best match. Look for a chunk about grounding retrieved context, not just generic RAG or training. Best match: ${expectedChunk?.source ?? expectedId}.`;

  return {
    passed,
    score,
    feedback,
    output: JSON.stringify({ query, selectedChunkId, expectedId, topMatch: top }, null, 2),
  };
}

export function listVectorPlaygroundChunks() {
  return VECTOR_PLAYGROUND_CHUNKS.map(({ id, source, text }) => ({ id, source, text }));
}
