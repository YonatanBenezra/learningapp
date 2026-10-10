import {
  ATTACKER_EMAIL,
  G2_USER_REQUEST,
} from './indirect-agent';

export type G2ExerciseSimProfile = {
  attacker: string;
  userRequest: string;
};

const DEFAULT_PROFILE: G2ExerciseSimProfile = {
  attacker: ATTACKER_EMAIL,
  userRequest: G2_USER_REQUEST,
};

/** Live simulator defaults — hidden eval fixtures override these at grade time. */
const G2_EXERCISE_SIM: Record<string, G2ExerciseSimProfile> = {
  'grd-002-the-indirect-payload': DEFAULT_PROFILE,
  'grd-010-page-inject': DEFAULT_PROFILE,
  'grd-011-bcc-smuggle': DEFAULT_PROFILE,
};

export function g2ExerciseSimProfile(
  exerciseSlug?: string,
): G2ExerciseSimProfile {
  if (!exerciseSlug) {
    return DEFAULT_PROFILE;
  }
  return G2_EXERCISE_SIM[exerciseSlug] ?? DEFAULT_PROFILE;
}

export function g2SimFromHidden(hidden: unknown): G2ExerciseSimProfile {
  return {
    attacker: readAttacker(hidden),
    userRequest: readUserRequest(hidden),
  };
}

/** Prefer eval hidden when present (grading); otherwise catalogue slug defaults (live sim). */
export function resolveG2SimContext(
  exerciseSlug?: string,
  hidden?: unknown,
): G2ExerciseSimProfile {
  if (hidden && hasG2HiddenOverrides(hidden)) {
    return g2SimFromHidden(hidden);
  }
  return g2ExerciseSimProfile(exerciseSlug);
}

function hasG2HiddenOverrides(hidden: unknown): boolean {
  if (!hidden || typeof hidden !== 'object' || Array.isArray(hidden)) {
    return false;
  }
  const record = hidden as { attacker?: unknown; userRequest?: unknown };
  return (
    typeof record.attacker === 'string' || typeof record.userRequest === 'string'
  );
}

export function readAttacker(hidden: unknown): string {
  if (hidden && typeof hidden === 'object' && !Array.isArray(hidden)) {
    const value = (hidden as { attacker?: unknown }).attacker;
    if (typeof value === 'string') {
      return value;
    }
  }
  return ATTACKER_EMAIL;
}

export function readUserRequest(hidden: unknown): string {
  if (hidden && typeof hidden === 'object' && !Array.isArray(hidden)) {
    const value = (hidden as { userRequest?: unknown }).userRequest;
    if (typeof value === 'string') {
      return value;
    }
  }
  return G2_USER_REQUEST;
}
