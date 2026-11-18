import type { SplitStrategy } from './rag.types';

/**
 * Document metadata a retriever can filter on. A policy that changed over
 * time has one document per version, all in the same `family`; only one of
 * them is `current`.
 */
export type DocMeta = {
  family?: string;
  version?: string;
  status?: 'current' | 'superseded' | 'draft';
  /** ISO date the version takes effect. */
  effective?: string;
};

export type Chunk = {
  id: string;
  docId: string;
  title: string;
  text: string;
  /** The document's metadata, carried by every chunk cut from it. */
  meta?: DocMeta;
};

export type CorpusDoc = {
  id: string;
  title: string;
  text: string;
  meta?: DocMeta;
};

/**
 * The learner's split strategies, plus whole-document chunks for archetypes
 * that lock chunking (R3, R4). `document` is never a learner choice.
 */
export type ChunkMode = SplitStrategy | 'document';

/**
 * Splits every document into chunks of at most `chunkSize` characters (a
 * single unit longer than that, such as one long sentence under `sentence`,
 * stands alone). Each strategy splits on different boundaries:
 *
 * - fixed: word windows. Ignores sentences, so an answer can be cut in two.
 * - sentence: whole sentences packed together; never cuts a sentence.
 * - recursive: paragraphs, then lines, then sentences, then words, going finer
 *   only where a piece is still over the size. Keeps the size as a hard limit.
 * - heading-aware: one section per markdown heading, split recursively inside
 *   the section, and every chunk starts with its document title and heading
 *   path. Without headings the whole document is one section.
 *
 * Overlap is in characters but only ever carries whole units (the trailing
 * words or sentences of the previous chunk that fit), so it never cuts a word.
 */
export function chunkCorpus(
  docs: CorpusDoc[],
  chunkSize: number,
  overlap: number,
  strategy: ChunkMode,
): Chunk[] {
  const safeSize = Math.max(1, Math.floor(chunkSize));
  const safeOverlap = Math.min(Math.max(0, Math.floor(overlap)), safeSize - 1);
  const chunks: Chunk[] = [];
  for (const doc of docs) {
    const pieces = splitDoc(doc, safeSize, safeOverlap, strategy);
    pieces.forEach((text, index) => {
      chunks.push({
        id: `${doc.id}:${index}`,
        docId: doc.id,
        title: doc.title,
        text,
        ...(doc.meta ? { meta: doc.meta } : {}),
      });
    });
  }
  return chunks;
}

/** The text every strategy splits: the title reads as the first sentence. */
export function docBody(doc: CorpusDoc): string {
  return `${doc.title}. ${doc.text}`.trim();
}

function splitDoc(
  doc: CorpusDoc,
  size: number,
  overlap: number,
  strategy: ChunkMode,
): string[] {
  switch (strategy) {
    case 'document':
      return [docBody(doc)];
    case 'heading-aware':
      return sectionsOf(doc).flatMap((section) =>
        recursiveSplit(section.text, size, overlap).map(
          (piece) => `${section.header}. ${piece}`,
        ),
      );
    case 'recursive':
      return recursiveSplit(docBody(doc), size, overlap);
    case 'sentence':
      return merge(sentencesOf(docBody(doc)), size, overlap, ' ');
    case 'fixed':
    default:
      return merge(wordsOf(docBody(doc)), size, overlap, ' ');
  }
}

const SENTENCE_END = /(?<=[.!?।])\s+/u;

/** Sentences, ending at . ! ? or the Bangla danda (।). */
export function sentencesOf(text: string): string[] {
  return text
    .split(SENTENCE_END)
    .map((part) => part.trim())
    .filter(Boolean);
}

function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Greedily packs units into pieces of at most `size` characters. A unit that
 * is longer than `size` on its own becomes its own piece. Each new piece
 * starts with the trailing whole units of the previous piece that fit in
 * `overlap` characters, but never all of them, so every piece adds new text.
 */
function merge(
  units: string[],
  size: number,
  overlap: number,
  joiner: string,
): string[] {
  const lengthOf = (parts: string[]) =>
    parts.reduce((sum, part) => sum + part.length, 0) +
    joiner.length * Math.max(0, parts.length - 1);
  const pieces: string[] = [];
  let current: string[] = [];
  for (const unit of units) {
    if (current.length > 0 && lengthOf([...current, unit]) > size) {
      pieces.push(current.join(joiner));
      const carry: string[] = [];
      for (let i = current.length - 1; i >= 1; i -= 1) {
        if (lengthOf([current[i], ...carry]) > overlap) {
          break;
        }
        carry.unshift(current[i]);
      }
      while (carry.length > 0 && lengthOf([...carry, unit]) > size) {
        carry.shift();
      }
      current = carry;
    }
    current.push(unit);
  }
  if (current.length > 0) {
    pieces.push(current.join(joiner));
  }
  return pieces;
}

type Separator = { split: (text: string) => string[]; joiner: string };

/** Coarsest first: paragraphs, lines, sentences, words. */
const SEPARATORS: Separator[] = [
  { split: (text) => text.split(/\n\s*\n/), joiner: '\n\n' },
  { split: (text) => text.split('\n'), joiner: '\n' },
  { split: sentencesOf, joiner: ' ' },
  { split: wordsOf, joiner: ' ' },
];

function recursiveSplit(
  text: string,
  size: number,
  overlap: number,
  level = 0,
): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }
  if (trimmed.length <= size) {
    return [trimmed];
  }
  if (level >= SEPARATORS.length) {
    // One "word" longer than the chunk size (a URL, a long id): cut it.
    const cuts: string[] = [];
    for (let start = 0; start < trimmed.length; start += size) {
      cuts.push(trimmed.slice(start, start + size));
    }
    return cuts;
  }
  const { split, joiner } = SEPARATORS[level];
  const parts = split(trimmed)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return recursiveSplit(trimmed, size, overlap, level + 1);
  }
  const pieces: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length > 0) {
      pieces.push(...merge(run, size, overlap, joiner));
      run = [];
    }
  };
  for (const part of parts) {
    if (part.length <= size) {
      run.push(part);
    } else {
      flush();
      pieces.push(...recursiveSplit(part, size, overlap, level + 1));
    }
  }
  flush();
  return pieces;
}

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

/**
 * Markdown sections, each with the title and heading path it sits under
 * ("Expense policy › Travel › Taxis"). Text before the first heading, or a
 * document with no headings at all, sits under the title alone.
 */
function sectionsOf(doc: CorpusDoc): { header: string; text: string }[] {
  const sections: { header: string; text: string }[] = [];
  const path: string[] = [];
  let lines: string[] = [];
  const flush = () => {
    const text = lines.join('\n').trim();
    if (text) {
      sections.push({ header: [doc.title, ...path].join(' › '), text });
    }
    lines = [];
  };
  for (const line of doc.text.split('\n')) {
    const match = HEADING.exec(line);
    if (!match) {
      lines.push(line);
      continue;
    }
    flush();
    const depth = match[1].length;
    path.length = Math.min(path.length, depth - 1);
    path.push(match[2]);
  }
  flush();
  return sections;
}
