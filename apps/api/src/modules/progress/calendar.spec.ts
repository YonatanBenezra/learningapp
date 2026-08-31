import {
  addCalendarDays,
  calendarDateKey,
  dayOrdinal,
  isValidTimeZone,
  resolveTimeZone,
} from './calendar';

describe('calendar', () => {
  it('accepts IANA timezones and falls back to UTC', () => {
    expect(isValidTimeZone('America/New_York')).toBe(true);
    expect(isValidTimeZone('Asia/Dhaka')).toBe(true);
    expect(isValidTimeZone('not-a-zone')).toBe(false);
    expect(resolveTimeZone('nope')).toBe('UTC');
    expect(resolveTimeZone('Asia/Dhaka')).toBe('Asia/Dhaka');
  });

  it('keys the same UTC instant to different calendar days around midnight', () => {
    const justAfterUtcMidnight = new Date('2026-09-01T00:30:00.000Z');
    expect(calendarDateKey(justAfterUtcMidnight, 'UTC')).toBe('2026-09-01');
    expect(calendarDateKey(justAfterUtcMidnight, 'America/New_York')).toBe(
      '2026-08-31',
    );
    expect(calendarDateKey(justAfterUtcMidnight, 'Asia/Dhaka')).toBe(
      '2026-09-01',
    );
  });

  it('adds calendar days without using the server local zone', () => {
    expect(addCalendarDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addCalendarDays('2026-09-01', -1)).toBe('2026-08-31');
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('uses a stable ordinal so rotation is deterministic', () => {
    expect(dayOrdinal('2026-09-02') - dayOrdinal('2026-09-01')).toBe(1);
  });
});
