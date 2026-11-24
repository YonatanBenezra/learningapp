import type { CorpusDoc } from '../modules/grading/harnesses/rag/chunking';
import type { QueryRewriter } from '../modules/grading/harnesses/rag/r4.grade';

const WORD = /[a-z][a-z-]*/g;

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return row[b.length];
}

/**
 * Offline stand-in for the live rewrite model, used only by content checks
 * (graded runs call the real model). It does what a good rewrite prompt asks
 * for: expands abbreviations the corpus defines ("PTO means paid time off")
 * and fixes misspelled words to the closest corpus word.
 */
export function simulatedRewriter(docs: CorpusDoc[]): QueryRewriter {
  const glossary = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const doc of docs) {
    for (const match of doc.text.matchAll(/\b([A-Z]{2,5}) means ([^.]+)\./g)) {
      glossary.set(match[1], match[2]);
    }
    for (const word of `${doc.title} ${doc.text}`.toLowerCase().match(WORD) ??
      []) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  const vocabulary = [...counts.keys()];
  const fix = (word: string): string => {
    const lower = word.toLowerCase();
    if (lower.length < 4 || counts.has(lower)) {
      return word;
    }
    let best = word;
    let bestDistance = 3;
    let bestCount = 0;
    for (const candidate of vocabulary) {
      if (Math.abs(candidate.length - lower.length) > 2) {
        continue;
      }
      const distance = editDistance(lower, candidate);
      const count = counts.get(candidate) ?? 0;
      if (
        distance < bestDistance ||
        (distance === bestDistance && count > bestCount)
      ) {
        best = candidate;
        bestDistance = distance;
        bestCount = count;
      }
    }
    return best;
  };
  return (_instruction, question) =>
    Promise.resolve(
      question
        .replace(/\b([A-Z]{2,5})s?\b/g, (abbr, bare: string) =>
          glossary.has(bare) ? (glossary.get(bare) as string) : abbr,
        )
        .replace(/[A-Za-z][A-Za-z-]*/g, fix),
    );
}
