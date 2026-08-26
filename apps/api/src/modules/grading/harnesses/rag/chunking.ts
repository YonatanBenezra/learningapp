import type { SplitStrategy } from './rag.types';

export type Chunk = {
  id: string;
  docId: string;
  title: string;
  text: string;
};

export type CorpusDoc = {
  id: string;
  title: string;
  text: string;
};

export function chunkCorpus(
  docs: CorpusDoc[],
  chunkSize: number,
  overlap: number,
  strategy: SplitStrategy,
): Chunk[] {
  const safeSize = Math.max(1, chunkSize);
  const safeOverlap = Math.min(Math.max(0, overlap), safeSize - 1);
  const chunks: Chunk[] = [];
  for (const doc of docs) {
    const pieces = splitDoc(doc, safeSize, safeOverlap, strategy);
    pieces.forEach((text, index) => {
      chunks.push({
        id: `${doc.id}:${index}`,
        docId: doc.id,
        title: doc.title,
        text,
      });
    });
  }
  return chunks;
}

function splitDoc(
  doc: CorpusDoc,
  chunkSize: number,
  overlap: number,
  strategy: SplitStrategy,
): string[] {
  const body = `${doc.title}. ${doc.text}`.trim();
  if (strategy === 'heading-aware') {
    return [body];
  }
  if (strategy === 'sentence' || strategy === 'recursive') {
    return packUnits(sentencesOf(body), chunkSize, overlap);
  }
  return windowText(body, chunkSize, overlap);
}

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function packUnits(
  units: string[],
  chunkSize: number,
  overlap: number,
): string[] {
  if (units.length === 0) {
    return [];
  }
  const packed: string[] = [];
  let current = '';
  for (const unit of units) {
    const next = current ? `${current} ${unit}` : unit;
    if (next.length <= chunkSize || current.length === 0) {
      current = next;
      continue;
    }
    packed.push(current);
    const overlapText = current.slice(Math.max(0, current.length - overlap));
    current = overlapText ? `${overlapText} ${unit}` : unit;
  }
  if (current) {
    packed.push(current);
  }
  return packed;
}

function windowText(
  text: string,
  chunkSize: number,
  overlap: number,
): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }
  const step = chunkSize - overlap;
  const windows: string[] = [];
  for (let start = 0; start < text.length; start += step) {
    windows.push(text.slice(start, start + chunkSize));
    if (start + chunkSize >= text.length) {
      break;
    }
  }
  return windows;
}
