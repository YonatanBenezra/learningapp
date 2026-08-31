import { addCalendarDays } from './calendar';

export type Streak = {
  current: number;
  longest: number;
  lastQualifiedDate: string | null;
};

/**
 * A calendar day qualifies when the user earned at least one `pass` that day
 * (in their timezone). Current streak is the consecutive run ending today, or
 * yesterday if today is not yet qualified (grace until local midnight).
 */
export function computeStreak(
  qualifiedDays: Iterable<string>,
  todayKey: string,
): Streak {
  const unique = [...new Set(qualifiedDays)].sort();
  if (unique.length === 0) {
    return { current: 0, longest: 0, lastQualifiedDate: null };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    if (unique[i] === addCalendarDays(unique[i - 1], 1)) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const lastQualifiedDate = unique[unique.length - 1];
  const yesterday = addCalendarDays(todayKey, -1);
  let current = 0;
  if (lastQualifiedDate === todayKey || lastQualifiedDate === yesterday) {
    current = 1;
    for (let i = unique.length - 2; i >= 0; i -= 1) {
      if (unique[i] === addCalendarDays(unique[i + 1], -1)) {
        current += 1;
      } else {
        break;
      }
    }
  }

  return {
    current,
    longest: Math.max(longest, current),
    lastQualifiedDate,
  };
}
