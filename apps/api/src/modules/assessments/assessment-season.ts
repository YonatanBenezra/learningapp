/** Quarterly season key for O11 — one assessment sitting per Pro user per season. */
export function assessmentSeasonKey(date: Date): string {
  const year = date.getUTCFullYear();
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

export function currentAssessmentSeasonKey(now = new Date()): string {
  return assessmentSeasonKey(now);
}
