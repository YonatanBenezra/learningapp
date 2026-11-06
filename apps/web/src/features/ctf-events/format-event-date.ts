const fmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatEventDateRange(startIso: string, endIso: string) {
  const start = fmt.format(new Date(startIso));
  const end = fmt.format(new Date(endIso));
  return `${start} - ${end}`;
}
