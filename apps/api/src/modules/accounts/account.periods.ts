export function utcMondayStart(now = new Date()): Date {
  const day = now.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysFromMonday,
    ),
  );
}

export function utcDateOnly(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function rollingWindowStart(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function sameUtcDay(left: Date, right: Date): boolean {
  return utcDateOnly(left).getTime() === utcDateOnly(right).getTime();
}
