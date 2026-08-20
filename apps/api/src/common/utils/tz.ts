// Timezone-aware calendar-day helpers, shared by the streak-reset and
// daily-reminder crons (§8, §10).

// Calendar-day number (days since the Unix epoch) as observed in `tz`.
export function dayNumberInTz(date: Date, tz: string): number {
  let ymd: string;
  try {
    ymd = date.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
  } catch {
    ymd = date.toLocaleDateString('en-CA', { timeZone: 'UTC' }); // invalid tz → UTC
  }
  return Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 86_400_000);
}

export function sameDayInTz(a: Date, b: Date, tz = 'UTC'): boolean {
  return dayNumberInTz(a, tz) === dayNumberInTz(b, tz);
}
