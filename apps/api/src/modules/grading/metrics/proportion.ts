export type ProportionTest = {
  n: number;
  v1Rate: number;
  v2Rate: number;
  diff: number;
  z: number;
  p: number;
};

export function twoProportionZ(
  v1Pass: number,
  v1N: number,
  v2Pass: number,
  v2N: number,
): ProportionTest {
  if (v1N <= 0 || v2N <= 0) {
    return { n: 0, v1Rate: 0, v2Rate: 0, diff: 0, z: 0, p: 1 };
  }
  const p1 = v1Pass / v1N;
  const p2 = v2Pass / v2N;
  const pooled = (v1Pass + v2Pass) / (v1N + v2N);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / v1N + 1 / v2N));
  const z = se === 0 ? 0 : (p2 - p1) / se;
  return {
    n: v1N,
    v1Rate: p1,
    v2Rate: p2,
    diff: p2 - p1,
    z,
    p: phi(z),
  };
}

export function adjustPValues(
  pvalues: number[],
  method: 'bonferroni' | 'benjamini_hochberg',
  alpha: number,
): { pAdj: number; significant: boolean }[] {
  const m = pvalues.length;
  if (m === 0) {
    return [];
  }
  if (method === 'bonferroni') {
    return pvalues.map((p) => {
      const pAdj = Math.min(1, p * m);
      return { pAdj, significant: pAdj < alpha };
    });
  }
  const order = pvalues
    .map((p, index) => ({ p, index }))
    .sort((a, b) => a.p - b.p);
  const pAdj = Array(m).fill(1);
  let running = 1;
  for (let rank = m; rank >= 1; rank -= 1) {
    const item = order[rank - 1];
    if (!item) {
      continue;
    }
    running = Math.min(running, (item.p * m) / rank);
    pAdj[item.index] = Math.min(1, running);
  }
  return pAdj.map((value) => ({
    pAdj: value,
    significant: value < alpha,
  }));
}

function phi(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return sign * y;
}
