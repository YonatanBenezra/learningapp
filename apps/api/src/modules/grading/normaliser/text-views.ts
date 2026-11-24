/**
 * Normalisation for guardrail filters (G3): the steps a learner can put before a check so
 * that encoded or disguised text is matched like plain text.
 *
 * A normalised text is a set of views of the raw text. The base view applies
 * the character steps (homoglyph folding, NFKC, lower case, joining spaced-out
 * letters); each decoded view is one hex or base64 blob decoded. Every view
 * keeps a map back to raw offsets, so a redaction found in any view can be
 * applied to the raw text.
 */

export const NORMALIZE_STEPS = [
  'decode_hex',
  'decode_base64',
  'unicode',
  'lowercase',
  'join_spaced',
] as const;

export type NormalizeStep = (typeof NORMALIZE_STEPS)[number];

export function isNormalizeStep(value: unknown): value is NormalizeStep {
  return (
    typeof value === 'string' &&
    (NORMALIZE_STEPS as readonly string[]).includes(value)
  );
}

/** Latin letters that have a Cyrillic or Greek look-alike. */
export const HOMOGLYPHS: Record<string, string> = {
  A: 'А',
  B: 'В',
  C: 'С',
  E: 'Е',
  H: 'Н',
  K: 'К',
  M: 'М',
  O: 'О',
  P: 'Р',
  T: 'Т',
  X: 'Х',
};

const FOLD: Record<string, string> = {};
for (const [latin, other] of Object.entries(HOMOGLYPHS)) {
  FOLD[other] = latin;
  FOLD[other.toLowerCase()] = latin.toLowerCase();
}

export type View = {
  text: string;
  /** Raw [start, end) for a [start, end) range of this view's text. */
  toRaw: (start: number, end: number) => [number, number];
};

export type Normalized = {
  views: View[];
  /** All views joined, one per line: what checks run against. */
  text: string;
};

/** A hex or base64 blob in the raw text and what it decodes to. */
export type Blob = { start: number; end: number; decoded: string };

const HEX_BLOB = /\b(?:[0-9a-fA-F]{2}){6,}\b/g;
const BASE64_BLOB =
  /(?<![A-Za-z0-9+/])[A-Za-z0-9+/]{12,}={0,2}(?![A-Za-z0-9+/=])/g;

function readable(text: string): boolean {
  if (!text) {
    return false;
  }
  let good = 0;
  for (const char of text) {
    if (/[\p{L}\p{N}\p{P}\p{Zs}]/u.test(char)) {
      good += 1;
    }
  }
  return good / [...text].length >= 0.9;
}

export function hexBlobs(raw: string): Blob[] {
  const out: Blob[] = [];
  for (const match of raw.matchAll(HEX_BLOB)) {
    const decoded = Buffer.from(match[0], 'hex').toString('utf8');
    if (readable(decoded) && /[A-Za-z]/.test(match[0])) {
      out.push({
        start: match.index,
        end: match.index + match[0].length,
        decoded,
      });
    }
  }
  return out;
}

export function base64Blobs(raw: string): Blob[] {
  const out: Blob[] = [];
  for (const match of raw.matchAll(BASE64_BLOB)) {
    const blob = match[0];
    if (blob.length % 4 !== 0 || /^[0-9a-fA-F]+$/.test(blob)) {
      continue;
    }
    const decoded = Buffer.from(blob, 'base64').toString('utf8');
    if (readable(decoded) && decoded.length >= 6) {
      out.push({ start: match.index, end: match.index + blob.length, decoded });
    }
  }
  return out;
}

type MappedChar = { char: string; raw: number };

function charSteps(text: string, offset: number, steps: Set<NormalizeStep>) {
  let chars: MappedChar[] = [];
  // Offsets count UTF-16 units, like String.slice.
  let raw = offset;
  for (const char of text) {
    const at = raw;
    raw += char.length;
    let out = char;
    if (steps.has('unicode')) {
      out = FOLD[out] ?? out;
      out = out.normalize('NFKC');
    }
    if (steps.has('lowercase')) {
      out = out.toLowerCase();
    }
    for (const piece of out) {
      chars.push({ char: piece, raw: at });
    }
  }
  if (steps.has('join_spaced')) {
    chars = joinSpaced(chars);
  }
  return chars;
}

/**
 * "O V E R R I D E" -> "OVERRIDE": a run of at least four single characters,
 * each separated by one space, loses the spaces.
 */
function joinSpaced(chars: MappedChar[]): MappedChar[] {
  const text = chars.map((row) => row.char).join('');
  const drop = new Set<number>();
  for (const match of text.matchAll(
    /(?:^|(?<= ))(?:\S ){3,}\S(?=[\s.,;:!?)\]]|$)/g,
  )) {
    for (let i = match.index; i < match.index + match[0].length; i += 1) {
      if (text[i] === ' ') {
        drop.add(i);
      }
    }
  }
  return chars.filter((_, index) => !drop.has(index));
}

function viewOf(chars: MappedChar[], rawEnd: number): View {
  const text = chars.map((row) => row.char).join('');
  return {
    text,
    toRaw: (start, end) => {
      const first = chars[start]?.raw ?? rawEnd;
      const last = end > start ? (chars[end - 1]?.raw ?? rawEnd - 1) : first;
      return [first, last + 1];
    },
  };
}

/** Applies the steps. With no steps, the one view is the raw text. */
export function normalize(
  raw: string,
  steps: readonly NormalizeStep[] = [],
): Normalized {
  const set = new Set(steps);
  const views: View[] = [viewOf(charSteps(raw, 0, set), raw.length)];
  const blobs = [
    ...(set.has('decode_hex') ? hexBlobs(raw) : []),
    ...(set.has('decode_base64') ? base64Blobs(raw) : []),
  ];
  for (const blob of blobs) {
    const decoded = viewOf(
      charSteps(blob.decoded, 0, set),
      blob.decoded.length,
    );
    views.push({
      text: decoded.text,
      toRaw: () => [blob.start, blob.end],
    });
  }
  return { views, text: views.map((view) => view.text).join('\n') };
}

/** Raw text with the given raw ranges replaced by `token` (overlaps merged). */
export function redactRanges(
  raw: string,
  ranges: [number, number][],
  token: string,
): string {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  let out = '';
  let cursor = 0;
  for (const [start, end] of merged) {
    out += raw.slice(cursor, start) + token;
    cursor = end;
  }
  return out + raw.slice(cursor);
}
