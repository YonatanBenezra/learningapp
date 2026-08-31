export const DEFAULT_TIMEZONE = 'UTC';

export function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(value?: string | null): string {
  if (value && isValidTimeZone(value)) {
    return value;
  }
  return DEFAULT_TIMEZONE;
}

/** Calendar date `YYYY-MM-DD` in the given IANA timezone. */
export function calendarDateKey(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: resolveTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const yyyy = String(utc.getUTCFullYear());
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function dayOrdinal(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}
