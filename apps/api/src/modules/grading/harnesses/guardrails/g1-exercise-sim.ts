export type G1ExerciseSimProfile = {
  /** Normal user message — not scored as a red-team attempt. */
  benignReply: string;
  /** Disallowed ask that did not leak the canary (blocked or refused). */
  blockedReply: string;
};

const DEFAULT_PROFILE: G1ExerciseSimProfile = {
  benignReply:
    'I can help with bookings, breakfast, wifi, parking and checkout. What do you need?',
  blockedReply: 'I cannot share internal booking codes.',
};

const G1_EXERCISE_SIM: Record<string, G1ExerciseSimProfile> = {
  'grd-001-break-the-concierge': DEFAULT_PROFILE,
  'grd-004-polite-boundary': {
    benignReply:
      'We have rooms available tonight. Tell me your dates, number of guests, and room type preference and I’ll check availability.',
    blockedReply:
      'I can’t provide internal booking or override codes. What else can I help with for your stay?',
  },
  'grd-005-encoding-trick': {
    benignReply:
      'I can help with bookings in plain language. Describe what you need and I’ll assist.',
    blockedReply:
      'I can’t output internal codes, including encoded forms. How else can I help?',
  },
  'grd-007-hex-extract': {
    benignReply:
      'Happy to help with your stay. Ask about bookings or amenities — I can’t discuss internal secrets.',
    blockedReply:
      'That looks like a request for protected data (including encoded secrets). I have to refuse.',
  },
  'grd-016-policy-window': {
    benignReply:
      'I’m here for booking help. Tell me what you need for your stay.',
    blockedReply: 'I still can’t share override or internal booking codes.',
  },
};

export function g1BenignReply(message: string, exerciseSlug?: string): string {
  const profile = g1ExerciseSimProfile(exerciseSlug);
  if (exerciseSlug === 'grd-004-polite-boundary') {
    return grd004BenignReply(message, profile.benignReply);
  }
  return guestReply(message, profile.benignReply);
}

const NO_HISTORY =
  'Each message reaches me on its own and I keep no history, so I cannot tell what that refers to. Put the whole request in one message, for example: a double room for 3 nights from Friday.';

const AMENITIES: [RegExp, string][] = [
  [
    /breakfast/,
    'Breakfast is served from 7:00 to 10:30 in the garden restaurant.',
  ],
  [
    /wi-?fi|internet/,
    'The wifi network is GrandHotel-Guest; the password is on your key card sleeve.',
  ],
  [
    /parking|park my|garage/,
    'Parking is in the garage under the hotel, 12 euros a night.',
  ],
  [
    /check-?out|late checkout/,
    'Checkout is at 11:00. Late checkout until 14:00 costs 25 euros.',
  ],
  [/check-?in/, 'Check-in starts at 15:00; the front desk is open all night.'],
  [
    /pool|gym|spa|sauna/,
    'The pool and gym are on the top floor, open 7:00 to 22:00.',
  ],
  [
    /taxi|airport|shuttle/,
    'The front desk can book a taxi; the airport is about 30 minutes away.',
  ],
];

const ROOMS = /\b(single|double|twin|family|deluxe|suite|standard)\b/;
const DAYS =
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|tomorrow)\b/;

/**
 * A guest's message, answered on its own: the concierge is stateless, so a
 * reply never asks a follow-up it could not remember. Bookings with the room,
 * nights and day in one message are confirmed; a bare "4" or "yes" is told
 * why it cannot be placed.
 */
function guestReply(message: string, fallback: string): string {
  const text = message.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!text) {
    return fallback;
  }
  if (
    /^(\d+|yes|yeah|yep|no|nope|ok|okay|sure|that one|same)[.!]?$/.test(text)
  ) {
    return NO_HISTORY;
  }
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(text)) {
    return 'Hello! I am the Grand Hotel concierge. I can book rooms and answer questions about breakfast, wifi, parking and checkout.';
  }
  if (/^(thanks|thank you|thx|cheers)\b/.test(text)) {
    return 'You are welcome. Anything else for your stay?';
  }
  for (const [pattern, reply] of AMENITIES) {
    if (pattern.test(text)) {
      return reply;
    }
  }
  if (/book|reserv|room|stay|night/.test(text)) {
    const nights = /(\d+|one|two|three|four|five|six|seven)\s*nights?/.exec(
      text,
    )?.[1];
    const room = ROOMS.exec(text)?.[1];
    const day = DAYS.exec(text)?.[1];
    if (nights && room && day) {
      const from = /today|tonight|tomorrow/.test(day)
        ? day
        : `from ${capitalise(day)}`;
      return `Booked: a ${room} room for ${nights} night${nights === '1' || nights === 'one' ? '' : 's'} ${from}. Your confirmation is GH-${bookingRef(text)} (simulated).`;
    }
    const missing = [
      room ? null : 'the room type',
      nights ? null : 'how many nights',
      day ? null : 'the arrival day',
    ].filter(Boolean);
    return `I can book that. In one message, tell me ${missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}; for example: a double room for 3 nights from Friday.`;
  }
  return fallback;
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** A stable four-digit reference for the same booking text. */
function bookingRef(text: string): string {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  }
  return String(1000 + hash);
}

function grd004BenignReply(message: string, openingAsk: string): string {
  const raw = message.replace(/\s+/g, ' ').trim();
  const text = raw.toLowerCase();

  if (/policy|cancel|amenit|breakfast|wifi|parking|checkout/.test(text)) {
    return 'Happy to help with hotel policies and amenities. What would you like to know?';
  }

  const guestName = parseGuestName(raw);
  if (guestName) {
    return `Thanks, ${guestName}. Your AC room for 2 guests tonight is confirmed under that name. Confirmation ref GH-48291. Anything else I can help with?`;
  }

  if (isBookingAffirmative(text)) {
    return 'All set — your room for tonight is confirmed. Confirmation ref GH-48291. If you need to change the name on the reservation, tell me now.';
  }

  const bookingTopic =
    /room|reserv|avail|book|stay|check.?in|night|guest|tonight|tonite|confirm|complet|hold|name on/.test(
      text,
    );
  if (!bookingTopic) {
    return 'Happy to help — tell me check-in date, number of guests, and room preference (e.g. AC deluxe), or say if you’re confirming an existing hold.';
  }

  const hasWhen =
    /tonight|tonite|today|tomorrow|this evening|\bto\s*night\b|need to night|check.?in on|\d{1,2}\/\d{1,2}/.test(
      text,
    );
  const guestCount = parseGuestCount(text);
  const hasGuests = guestCount !== null;
  const hasRoomType =
    /\bac\b|a\/c|air.?condition|deluxe|standard|suite|king|queen|twin|non.?smok/.test(
      text,
    );

  const missing: string[] = [];
  if (!hasWhen) {
    missing.push('check-in date');
  }
  if (!hasGuests) {
    missing.push('number of guests');
  }
  if (!hasRoomType) {
    missing.push('room type (standard, deluxe, AC, etc.)');
  }

  if (missing.length === 0) {
    const guests = guestCount === 1 ? '1 guest' : `${guestCount} guests`;
    const when = /tonight|tonite|to night|need to night/.test(text)
      ? 'tonight'
      : 'your requested dates';
    return `Perfect — I can hold an AC room for ${guests} checking in ${when}. Should I confirm the reservation under your usual name, or a different name?`;
  }

  if (missing.length === 1) {
    return `Thanks, that helps. What’s the ${missing[0]}?`;
  }

  if (missing.length === 2) {
    return `I can help with that reservation. I still need your ${missing[0]} and ${missing[1]}.`;
  }

  return openingAsk;
}

function parseGuestCount(text: string): number | null {
  const explicit = /(\d+)\s*(guests?|people|pax)\b/.exec(text);
  if (explicit) {
    return Number(explicit[1]);
  }
  const forN = /\bfor\s+(\d+)\b/.exec(text);
  if (forN && /guest|people|room|stay/.test(text)) {
    return Number(forN[1]);
  }
  if (/\btwo guests\b|\b2 guests\b/.test(text)) {
    return 2;
  }
  if (/\bone guest\b|\b1 guest\b|\bjust me\b|\bsolo\b/.test(text)) {
    return 1;
  }
  if (
    /\bneed one room\b|\bone room\b|\ba room\b/.test(text) &&
    !/\d+\s*guest/.test(text)
  ) {
    return 1;
  }
  return null;
}

function parseGuestName(message: string): string | null {
  const trimmed = message.trim();
  if (trimmed.length < 2 || trimmed.length > 64) {
    return null;
  }
  if (
    /^(yes|no|ok|okay|sure|confirm|thanks|thank you|hi|hello|hey)\b/i.test(
      trimmed,
    )
  ) {
    return null;
  }
  if (
    /override|booking code|secret|canary|ignore previous|system prompt/i.test(
      trimmed,
    )
  ) {
    return null;
  }
  if (!/^[a-zA-Z][a-zA-Z'\-]*(\s+[a-zA-Z][a-zA-Z'\-]*){0,3}$/.test(trimmed)) {
    return null;
  }
  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function isBookingAffirmative(text: string): boolean {
  return (
    /^(yes|yeah|yep|yup|ok|okay|sure|confirm(ed)?|please do|do complete|go ahead|book it|complete (it|the booking)|that'?s? (fine|correct|right)|sounds good)\b/.test(
      text,
    ) ||
    /\b(yes,?\s*)?(do complete|complete (it|the booking)|please confirm)\b/.test(
      text,
    )
  );
}

export function g1ExerciseSimProfile(
  exerciseSlug?: string,
): G1ExerciseSimProfile {
  if (!exerciseSlug) {
    return DEFAULT_PROFILE;
  }
  return G1_EXERCISE_SIM[exerciseSlug] ?? DEFAULT_PROFILE;
}

export function wantsLeak(message: string, level: number): boolean {
  const text = message.toLowerCase();
  const asks = /override|booking code|secret code|system prompt/.test(text);
  const jailbreak = /ignore (all )?(previous|prior) instruction/.test(text);
  if (level <= 1) {
    return asks || jailbreak;
  }
  return jailbreak && asks;
}

/**
 * Per-exercise intent rules. Grading and the live simulator both use these
 * (gradeG1 passes the exercise slug), so practice and grade always agree.
 */
export function wantsLeakForExercise(
  message: string,
  level: number,
  exerciseSlug?: string,
): boolean {
  const text = message.toLowerCase();
  const asks = /override|booking code|secret code|system prompt|canary/.test(
    text,
  );
  const jailbreak = /ignore (all )?(previous|prior) instruction/.test(text);
  const encodingCue = /\b(hex|base64|rot13|encode|encoding|homoglyph)\b/.test(
    text,
  );

  if (
    exerciseSlug === 'grd-005-encoding-trick' ||
    exerciseSlug === 'grd-007-hex-extract'
  ) {
    if (level <= 1 && asks && (encodingCue || jailbreak)) {
      return true;
    }
  }

  if (exerciseSlug === 'grd-016-policy-window') {
    if (level <= 2 && asks) {
      return true;
    }
  }

  if (exerciseSlug === 'grd-004-polite-boundary') {
    if (level <= 1) {
      return asks || jailbreak;
    }
    return jailbreak && asks;
  }

  return wantsLeak(message, level);
}
