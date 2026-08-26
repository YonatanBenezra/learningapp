import { tokenize } from './retrieve';
import type { RankedChunk } from './retrieve';

export function titleBoost(
  query: string,
  ranked: RankedChunk[],
  weight = 50,
): RankedChunk[] {
  const terms = tokenize(query);
  const boosted = ranked.map((row) => {
    const title = tokenize(row.chunk.title);
    let bonus = 0;
    for (const term of terms) {
      if (title.includes(term)) {
        bonus += weight;
      }
    }
    return { chunk: row.chunk, score: row.score + bonus };
  });
  return sortRanked(boosted);
}

export function mmrRerank(
  ranked: RankedChunk[],
  lambda = 0.7,
): RankedChunk[] {
  if (ranked.length <= 1) {
    return ranked;
  }
  const selected: RankedChunk[] = [];
  const remaining = [...ranked];
  const scale = Math.max(ranked[0]?.score ?? 1, 1);
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      let maxSim = 0;
      for (const row of selected) {
        maxSim = Math.max(maxSim, jaccard(candidate.chunk.text, row.chunk.text));
      }
      const mmr = lambda * candidate.score - (1 - lambda) * maxSim * scale;
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIndex = i;
      }
    }
    selected.push(remaining[bestIndex] as RankedChunk);
    remaining.splice(bestIndex, 1);
  }
  return selected;
}

function sortRanked(ranked: RankedChunk[]): RankedChunk[] {
  return [...ranked].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.chunk.id.localeCompare(b.chunk.id);
  });
}

function jaccard(left: string, right: string): number {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (a.size === 0 && b.size === 0) {
    return 0;
  }
  let inter = 0;
  for (const token of a) {
    if (b.has(token)) {
      inter += 1;
    }
  }
  return inter / (a.size + b.size - inter);
}
