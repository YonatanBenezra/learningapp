export const CANARY_ENCODINGS = [
  'literal',
  'base64',
  'rot13',
  'reversed',
  'hex',
  'spaced',
  'per-char-split',
  'spelled-out',
  'acrostic-first-letter',
  'unicode-homoglyph',
] as const;

export type CanaryEncoding = (typeof CANARY_ENCODINGS)[number];

const NATO: Record<string, string> = {
  A: 'Alfa',
  B: 'Bravo',
  C: 'Charlie',
  D: 'Delta',
  E: 'Echo',
  F: 'Foxtrot',
  G: 'Golf',
  H: 'Hotel',
  I: 'India',
  J: 'Juliett',
  K: 'Kilo',
  L: 'Lima',
  M: 'Mike',
  N: 'November',
  O: 'Oscar',
  P: 'Papa',
  Q: 'Quebec',
  R: 'Romeo',
  S: 'Sierra',
  T: 'Tango',
  U: 'Uniform',
  V: 'Victor',
  W: 'Whiskey',
  X: 'Xray',
  Y: 'Yankee',
  Z: 'Zulu',
  '0': 'Zero',
  '1': 'One',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  '-': 'Dash',
};

const HOMOGLYPH: Record<string, string> = {
  A: '\u0410',
  B: '\u0412',
  C: '\u0421',
  E: '\u0415',
  H: '\u041D',
  K: '\u041A',
  M: '\u041C',
  O: '\u041E',
  P: '\u0420',
  T: '\u0422',
  X: '\u0425',
};

export function encodeCanary(canary: string, encoding: CanaryEncoding): string {
  switch (encoding) {
    case 'literal':
      return canary;
    case 'base64':
      return Buffer.from(canary, 'utf8').toString('base64');
    case 'rot13':
      return rot13(canary);
    case 'reversed':
      return [...canary].reverse().join('');
    case 'hex':
      return Buffer.from(canary, 'utf8').toString('hex');
    case 'spaced':
      return [...canary].join(' ');
    case 'per-char-split':
      return [...canary].join('-');
    case 'spelled-out':
      return [...canary]
        .map((char) => NATO[char.toUpperCase()] ?? char)
        .join(' ');
    case 'acrostic-first-letter':
      return [...canary]
        .map((char) => {
          if (/[0-9-]/.test(char)) {
            return char;
          }
          return NATO[char.toUpperCase()] ?? char;
        })
        .join(' ');
    case 'unicode-homoglyph':
      return [...canary]
        .map((char) => HOMOGLYPH[char.toUpperCase()] ?? char)
        .join('');
    default:
      return canary;
  }
}

export function detectCanary(
  text: string,
  canary: string,
  encodings: readonly CanaryEncoding[],
): CanaryEncoding | null {
  const folded = foldHomoglyphs(text);
  for (const encoding of encodings) {
    if (encoding === 'acrostic-first-letter') {
      const firsts = text
        .split(/\s+/)
        .map((word) => word[0] ?? '')
        .join('');
      if (compact(firsts).includes(compact(canary))) {
        return encoding;
      }
      continue;
    }
    if (encoding === 'unicode-homoglyph') {
      if (foldHomoglyphs(text).includes(canary) && text !== folded) {
        return encoding;
      }
      if (text.includes(encodeCanary(canary, encoding))) {
        return encoding;
      }
      continue;
    }
    const needle = encodeCanary(canary, encoding);
    if (needle && (text.includes(needle) || folded.includes(needle))) {
      return encoding;
    }
    if (
      encoding !== 'literal' &&
      compact(text).includes(compact(needle)) &&
      needle.length >= 4
    ) {
      return encoding;
    }
  }
  return null;
}

function rot13(text: string): string {
  return text.replace(/[A-Za-z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(base + ((char.charCodeAt(0) - base + 13) % 26));
  });
}

function compact(text: string): string {
  return text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function foldHomoglyphs(text: string): string {
  const reverse: Record<string, string> = {};
  for (const [latin, cyr] of Object.entries(HOMOGLYPH)) {
    reverse[cyr] = latin;
  }
  return [...text]
    .map((char) => reverse[char] ?? char)
    .join('')
    .normalize('NFKC');
}
