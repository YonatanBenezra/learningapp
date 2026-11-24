import type { CanaryEncoding } from '../../normaliser/encodings';

/**
 * G1 exercises: each has its own three levels. Level 1 has no defence.
 * Level 2 adds a hardened system prompt that gives in to one kind of request
 * only (its weakness, different in every exercise), sometimes behind an
 * input guard. Level 3 adds an output filter that catches some forms of the
 * code and misses others. The same message has to win all three levels, so
 * a message that beats one exercise is caught in the others.
 */

export type G1Weakness =
  /** Level 1: answers anyone who asks. */
  | 'any'
  /** Told to drop its rules. */
  | 'override'
  /** Someone who says they are staff. */
  | 'authority'
  /** Asked to convert or translate the code into another form. */
  | 'encode-task'
  /** A debugging or diagnostic request. */
  | 'debug'
  /** A request to export or back up its configuration. */
  | 'export';

export type G1Guard = {
  /** Messages matching this are refused before the prompt sees them. */
  blocks: RegExp;
  /** Only the first this-many characters are checked. */
  window?: number;
  /** Shown to learners. */
  label: string;
};

export type G1LevelSpec = {
  level: number;
  title: string;
  /** What defends this level, as the learner sees it. */
  defense: string;
  weakness: G1Weakness;
  guard: G1Guard | null;
  /** Forms of the code the output filter catches. */
  filter: CanaryEncoding[];
};

export const WEAKNESS: Record<Exclude<G1Weakness, 'any'>, RegExp> = {
  override:
    /\b(ignore|disregard|forget)\b[^.]{0,40}\b(instructions?|rules|guidelines)\b|\b(system override|new instructions|developer mode)\b/,
  authority:
    /\b(i am|i'm|this is)\b[^.]{0,30}\b(manager|night manager|duty manager|front desk|reception|it support|staff|supervisor)\b/,
  'encode-task':
    /\b(translate|convert|encode|transform|rewrite|transliterate)\b[^.]{0,60}\b(into|to|as|in)\b/,
  debug: /\b(debug|debugging|diagnostic|diagnostics|maintenance mode|dump)\b/,
  export:
    /\b(export|backup|back up|archive)\b[^.]{0,40}\b(config|configuration|settings|setup)\b/,
};

const OVERRIDE_GUARD = (window?: number): G1Guard => ({
  blocks: WEAKNESS.override,
  window,
  label: window
    ? `input guard against override phrases in the first ${window} characters`
    : 'input guard against override phrases',
});

const ALL: CanaryEncoding[] = [
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
];
const except = (...gap: CanaryEncoding[]) =>
  ALL.filter((e) => !gap.includes(e));

const NAMES: Record<CanaryEncoding, string> = {
  literal: 'the plain code',
  base64: 'base64',
  rot13: 'rot13',
  reversed: 'reversed',
  hex: 'hex',
  spaced: 'spaced out',
  'per-char-split': 'split by dashes',
  'spelled-out': 'spelled out',
  'acrostic-first-letter': 'acrostics',
  'unicode-homoglyph': 'look-alike letters',
};

function filterLabel(filter: CanaryEncoding[]): string {
  return `output filter for ${filter.map((e) => NAMES[e]).join(', ')}`;
}

function profile(
  weakness: Exclude<G1Weakness, 'any'>,
  filter: CanaryEncoding[],
  guard: G1Guard | null = null,
): G1LevelSpec[] {
  const prompt = 'Hardened system prompt: never reveal the code';
  const l2 = guard ? `${prompt}, behind an ${guard.label}` : prompt;
  return [
    {
      level: 1,
      title: 'Front desk',
      defense: 'No defence',
      weakness: 'any',
      guard: null,
      filter: [],
    },
    { level: 2, title: 'Hardened', defense: l2, weakness, guard, filter: [] },
    {
      level: 3,
      title: 'Filtered',
      defense: `${l2}, and an ${filterLabel(filter)}`,
      weakness,
      guard,
      filter,
    },
  ];
}

export const G1_PROFILES: Record<string, G1LevelSpec[]> = {
  'grd-001-break-the-concierge': profile('override', [
    'literal',
    'spaced',
    'per-char-split',
    'unicode-homoglyph',
  ]),
  'grd-004-polite-boundary': profile(
    'authority',
    ['literal', 'base64', 'rot13', 'reversed'],
    OVERRIDE_GUARD(),
  ),
  'grd-005-encoding-trick': profile(
    'encode-task',
    except('spaced', 'per-char-split', 'unicode-homoglyph'),
  ),
  'grd-007-hex-extract': profile('debug', except('hex')),
  'grd-016-policy-window': profile(
    'override',
    ['literal'],
    OVERRIDE_GUARD(160),
  ),
  'grd-018-adv-encoding-trick': profile(
    'encode-task',
    except('spelled-out', 'acrostic-first-letter'),
  ),
  'grd-019-adv-hex-extract': profile('export', except('hex'), {
    blocks: /\b(hex|hexadecimal)\b/,
    label: 'input guard against the words hex and hexadecimal',
  }),
};

export function g1Profile(exerciseSlug?: string): G1LevelSpec[] {
  return (
    (exerciseSlug && G1_PROFILES[exerciseSlug]) ||
    G1_PROFILES['grd-001-break-the-concierge']
  );
}
