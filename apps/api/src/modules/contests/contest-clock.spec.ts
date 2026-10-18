import {
  buildContestClock,
  contestPersonalDeadlineAt,
  contestWindowDeadlineAt,
} from './contest-clock';

describe('contest-clock', () => {
  const contest = {
    startsAt: new Date('2026-10-18T00:00:00.000Z'),
    endsAt: new Date('2026-10-27T12:00:00.000Z'),
    timeBoxMinutes: 180,
  };

  it('maps window deadlines', () => {
    expect(
      contestWindowDeadlineAt(contest, 'upcoming'),
    ).toBe('2026-10-18T00:00:00.000Z');
    expect(contestWindowDeadlineAt(contest, 'open')).toBe(
      '2026-10-27T12:00:00.000Z',
    );
    expect(contestWindowDeadlineAt(contest, 'closed')).toBeNull();
  });

  it('builds personal deadline for active entry', () => {
    const startedAt = new Date('2026-10-18T10:00:00.000Z');
    const clock = buildContestClock(
      contest,
      'open',
      { startedAt, status: 'active' },
      new Date('2026-10-18T11:00:00.000Z'),
    );
    expect(clock.startedAt).toBe(startedAt.toISOString());
    expect(clock.personalDeadlineAt).toBe(
      contestPersonalDeadlineAt(180, startedAt),
    );
  });
});
