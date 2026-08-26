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

export function retrieveRanked(
  question: string,
  chunks: Chunk[],
  k: number,
): RankedChunk[] {
  const query = tokenize(question);
  const scored = chunks.map((chunk) => {
    const tf = tokenize(chunk.text);
    let score = 0;
    for (const term of query) {
      score += tf.filter((token) => token === term).length;
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
