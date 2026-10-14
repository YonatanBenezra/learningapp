import type { Simulator } from '@prisma/client';

export type LeaderboardTrackKey = 'rag' | 'eval' | 'guard' | 'prompt';

export const LEADERBOARD_TRACK_KEYS: LeaderboardTrackKey[] = [
  'rag',
  'eval',
  'guard',
  'prompt',
];

export function simulatorToTrack(
  simulator: Simulator,
): LeaderboardTrackKey | null {
  switch (simulator) {
    case 'rag':
      return 'rag';
    case 'evaluation':
      return 'eval';
    case 'guardrails':
      return 'guard';
    case 'prompt_engineering':
      return 'prompt';
    default:
      return null;
  }
}

export function emptyTrackCounts(): Record<LeaderboardTrackKey, number> {
  return { rag: 0, eval: 0, guard: 0, prompt: 0 };
}

export function strongestTracksFromCounts(
  counts: Record<LeaderboardTrackKey, number>,
  limit = 2,
): LeaderboardTrackKey[] {
  return LEADERBOARD_TRACK_KEYS.filter((key) => counts[key] > 0)
    .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
    .slice(0, limit);
}

/** Longest streak of consecutive calendar days with ≥1 pass, ending on the latest pass day. */
export function streakDaysFromPassDates(dates: Date[]): number {
  if (dates.length === 0) {
    return 0;
  }
  const dayKeys = [
    ...new Set(dates.map((d) => d.toISOString().slice(0, 10))),
  ].sort();
  let streak = 1;
  for (let i = dayKeys.length - 1; i > 0; i -= 1) {
    const cur = Date.parse(`${dayKeys[i]}T00:00:00.000Z`);
    const prev = Date.parse(`${dayKeys[i - 1]}T00:00:00.000Z`);
    if ((cur - prev) / 86_400_000 === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
