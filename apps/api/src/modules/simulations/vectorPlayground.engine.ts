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

export function lexicalOverlap(query: string, text: string): { score: number; terms: string[] } {
  const queryTokens = tokenize(query);
  const chunkTokens = tokenize(text);
  if (queryTokens.size === 0) return { score: 0, terms: [] };

  const terms = [...queryTokens].filter((token) => chunkTokens.has(token));
  return {
    score: Math.round((terms.length / queryTokens.size) * 100),
    terms,
  };
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

export function runVectorPlayground(query: string, topK = 3): VectorPlaygroundRunResult {
  const k = Math.min(5, Math.max(1, topK));
  const ranked = VECTOR_PLAYGROUND_CHUNKS.map((chunk) => {
    const lexical = lexicalOverlap(query, `${chunk.source} ${chunk.text}`);
    const score = scoreChunk(query, chunk);
    return {
      id: chunk.id,
      source: chunk.source,
      text: chunk.text,
      score,
      cosine: score / 100,
      lexicalScore: lexical.score,
      lexicalTerms: lexical.terms,
    };
  }).sort((a, b) => b.score - a.score);

  const index = ranked.map((match, position) => ({
    ...match,
    rank: position + 1,
    retrieved: position < k,
  }));

  const hints: string[] = [];
  if (index[0]?.score < 45) {
    hints.push('Try query words like "hallucination", "RAG", or "grounding".');
  }
  if (index.length > 1 && index[0].score - index[1].score < 8) {
    hints.push('Top scores are close — compare whether the chunk mentions grounding vs generic RAG.');
  }

  return {
    matches: index.filter((match) => match.retrieved),
    index,
    hints,
    defaultQuery: DEFAULT_QUERY,
    topK: k,
    topMatchId: index[0]?.id,
  };
}

export function submitVectorPlayground(
  query: string,
  selectedChunkId: string,
): SimulationSubmitResult {
  const run = runVectorPlayground(query, 5);
  const top = run.index[0];
  const selected = run.index.find((row) => row.id === selectedChunkId);
  const passed = Boolean(selected && top && selected.id === top.id);
  const score = selected ? selected.score : 0;

  const feedback = passed
    ? `Correct pick. "${top?.source ?? ''}" had the highest score (${top?.cosine.toFixed(3)}).`
    : `Not the top match. You picked "${selected?.source ?? selectedChunkId}" (rank ${selected?.rank ?? '—'}). Top was "${top?.source ?? ''}".`;

  return {
    passed,
    score,
    feedback,
    output: JSON.stringify({ query, selectedChunkId, topMatchId: top?.id, selectedRank: selected?.rank }, null, 2),
  };
}

export function listVectorPlaygroundChunks() {
  return VECTOR_PLAYGROUND_CHUNKS.map(({ id, source, text }) => ({ id, source, text }));
}
