/** Dynamic scoring: base decays with solves, floor at 50% of base. */
export function dynamicPoints(base: number, solves: number, cap = 150): number {
  const decay = base * 0.5 * Math.min(1, solves / cap);
  return Math.max(base * 0.5, Math.round(base - decay));
}
