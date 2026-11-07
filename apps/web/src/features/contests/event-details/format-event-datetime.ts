const valueFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function formatEventDateTime(iso: string): string {
  return valueFmt.format(new Date(iso));
}
