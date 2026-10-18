import type { Contest } from '@prisma/client';

export type ContestWindowPhase = 'upcoming' | 'open' | 'closed';

export type ContestClock = {
  startedAt: string | null;
  windowDeadlineAt: string | null;
  personalDeadlineAt: string | null;
};

export function contestWindowDeadlineAt(
  contest: Pick<Contest, 'startsAt' | 'endsAt'>,
  window: ContestWindowPhase,
): string | null {
  if (window === 'upcoming') {
    return contest.startsAt.toISOString();
  }
  if (window === 'open') {
    return contest.endsAt.toISOString();
  }
  return null;
}

export function contestPersonalDeadlineAt(
  timeBoxMinutes: number,
  startedAt: Date,
): string {
  return new Date(
    startedAt.getTime() + timeBoxMinutes * 60_000,
  ).toISOString();
}

export function buildContestClock(
  contest: Pick<Contest, 'startsAt' | 'endsAt' | 'timeBoxMinutes'>,
  window: ContestWindowPhase,
  entry: { startedAt: Date; status: string } | null,
  now: Date,
): ContestClock {
  const windowDeadlineAt = contestWindowDeadlineAt(contest, window);
  let personalDeadlineAt: string | null = null;
  if (
    entry &&
    entry.status === 'active' &&
    now.getTime() <=
      entry.startedAt.getTime() + contest.timeBoxMinutes * 60_000
  ) {
    personalDeadlineAt = contestPersonalDeadlineAt(
      contest.timeBoxMinutes,
      entry.startedAt,
    );
  }
  return {
    startedAt: entry?.startedAt.toISOString() ?? null,
    windowDeadlineAt,
    personalDeadlineAt,
  };
}
