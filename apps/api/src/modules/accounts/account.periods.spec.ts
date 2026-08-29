import {
  rollingWindowStart,
  sameUtcDay,
  utcDateOnly,
  utcMondayStart,
} from './account.periods';

describe('account periods', () => {
  it('aligns free quota to UTC Monday 00:00', () => {
    const wednesday = new Date('2026-09-02T15:30:00Z');
    expect(utcMondayStart(wednesday).toISOString()).toBe(
      '2026-08-31T00:00:00.000Z',
    );
    const sunday = new Date('2026-09-06T01:00:00Z');
    expect(utcMondayStart(sunday).toISOString()).toBe(
      '2026-08-31T00:00:00.000Z',
    );
  });

  it('compares UTC calendar days', () => {
    expect(
      sameUtcDay(
        new Date('2026-09-01T01:00:00Z'),
        new Date('2026-09-01T23:59:00Z'),
      ),
    ).toBe(true);
    expect(utcDateOnly(new Date('2026-09-01T23:00:00Z')).toISOString()).toBe(
      '2026-09-01T00:00:00.000Z',
    );
  });

  it('computes a rolling 30-day window start', () => {
    const now = new Date('2026-09-30T12:00:00Z');
    expect(rollingWindowStart(now, 30).toISOString()).toBe(
      '2026-08-31T12:00:00.000Z',
    );
  });
});
