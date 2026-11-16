import type { Chunk } from './chunking';

const STOP = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'of',
  'to',
  'in',
  'on',
  'for',
  'and',
  'or',
  'how',
  'what',
  'when',
  'where',
  'who',
  'which',
  'must',
  'may',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP.has(token))
    .map(stem);
}

function stem(token: string): string {
  if (token.length <= 3) {
    return token;
  }
  if (token.endsWith('ies')) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith('sses')) {
    return token.slice(0, -2);
  }
  if (token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }
  return token;
}

export type RankedChunk = {
  chunk: Chunk;
  score: number;
};

/** Standard Okapi BM25 parameters. */
const BM25_K1 = 1.2;
const BM25_B = 0.75;

/**
 * Okapi BM25 over the given chunk set. IDF down-weights terms that appear in
 * many chunks, and length normalisation stops longer chunks from winning just
 * because they repeat more query terms. Deterministic: no randomness, ties
 * break on chunk id.
 */
export function retrieveRanked(
  question: string,
  chunks: Chunk[],
  k: number,
): RankedChunk[] {
  const query = [...new Set(tokenize(question))];
  const termCounts = chunks.map((chunk) => {
    const counts = new Map<string, number>();
    for (const token of tokenize(chunk.text)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
    return counts;
  });
  const lengths = termCounts.map((counts) =>
    [...counts.values()].reduce((sum, value) => sum + value, 0),
  );
  const total = chunks.length;
  const avgLength =
    total === 0 ? 0 : lengths.reduce((sum, value) => sum + value, 0) / total;
  const idf = new Map<string, number>();
  for (const term of query) {
    const docFreq = termCounts.filter((counts) => counts.has(term)).length;
    idf.set(term, Math.log(1 + (total - docFreq + 0.5) / (docFreq + 0.5)));
  }

  const scored = chunks.map((chunk, index) => {
    const counts = termCounts[index];
    const norm =
      avgLength === 0 ? 1 : 1 - BM25_B + (BM25_B * lengths[index]) / avgLength;
    let score = 0;
    for (const term of query) {
      const tf = counts.get(term) ?? 0;
      if (tf > 0) {
        score +=
          ((idf.get(term) ?? 0) * (tf * (BM25_K1 + 1))) / (tf + BM25_K1 * norm);
      }
    }
    return { chunk, score };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.chunk.id.localeCompare(b.chunk.id);
  });
  return scored.slice(0, k);
}

/**
 * Naive keyword count: sums raw query-term occurrences, no IDF and no length
 * normalisation. Kept only as R4's deliberately weak first stage, so the
 * reranker the learner picks has ordering mistakes to fix.
 */
export function retrieveByTermCount(
  question: string,
  chunks: Chunk[],
  k: number,
): RankedChunk[] {
  const query = tokenize(question);
  const scored = chunks.map((chunk) => {
    const tokens = tokenize(chunk.text);
    let score = 0;
    for (const term of query) {
      score += tokens.filter((token) => token === term).length;
    }
    return { chunk, score };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.chunk.id.localeCompare(b.chunk.id);
  });
  return scored.slice(0, k);
}

export function retrieveTopK(
  question: string,
  chunks: Chunk[],
  k: number,
): Chunk[] {
  return retrieveRanked(question, chunks, k).map((row) => row.chunk);
}

export function chunkContainsSpan(
  chunkText: string,
  goldSpan: string,
): boolean {
  return normalize(chunkText).includes(normalize(goldSpan));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}
