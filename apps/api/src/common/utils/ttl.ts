const TTL_PATTERN = /^(\d+)(ms|s|m|h|d)$/;

export function ttlToMs(ttl: string): number {
  const match = TTL_PATTERN.exec(ttl);
  if (!match) {
    throw new Error(`Invalid TTL: ${ttl}`);
  }
  const value = Number(match[1]);
  switch (match[2]) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60_000;
    case 'h':
      return value * 3_600_000;
    case 'd':
      return value * 86_400_000;
    default:
      throw new Error(`Invalid TTL: ${ttl}`);
  }
}
