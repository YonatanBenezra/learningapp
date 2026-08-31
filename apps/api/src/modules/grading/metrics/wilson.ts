export type WilsonInterval = {
  low: number;
  high: number;
  p: number;
  n: number;
};

/** Wilson score interval, z = 1.96 (95%). */
export function wilsonInterval(
  successes: number,
  n: number,
  z = 1.96,
): WilsonInterval {
  if (n <= 0) {
    return { low: 0, high: 1, p: 0, n: 0 };
  }
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return {
    low: Math.max(0, (center - margin) / denom),
    high: Math.min(1, (center + margin) / denom),
    p,
    n,
  };
}

export function intervalsOverlap(
  left: WilsonInterval,
  right: WilsonInterval,
): boolean {
  return left.low <= right.high && right.low <= left.high;
}

export function intervalVerdict(
  interval: WilsonInterval,
  threshold: number,
): 'pass' | 'fail' | 'inconclusive' {
  if (interval.low >= threshold) {
    return 'pass';
  }
  if (interval.high < threshold) {
    return 'fail';
  }
  return 'inconclusive';
}
