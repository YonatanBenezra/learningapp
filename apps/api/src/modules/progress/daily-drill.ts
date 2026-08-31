import { dayOrdinal } from './calendar';

export type DrillCandidate = {
  slug: string;
  title: string;
  difficulty: string;
  simulator: string;
  type: string;
};

function bySlug(left: DrillCandidate, right: DrillCandidate): number {
  return left.slug.localeCompare(right.slug);
}

export function uniqueBySlug(exercises: DrillCandidate[]): DrillCandidate[] {
  const seen = new Set<string>();
  const out: DrillCandidate[] = [];
  for (const exercise of exercises) {
    if (seen.has(exercise.slug)) {
      continue;
    }
    seen.add(exercise.slug);
    out.push(exercise);
  }
  return out;
}

/** Prefer `drill` type, else Easy, else the full published catalogue. */
export function drillPool(exercises: DrillCandidate[]): DrillCandidate[] {
  const unique = uniqueBySlug(exercises).sort(bySlug);
  const drills = unique.filter((exercise) => exercise.type === 'drill');
  if (drills.length > 0) {
    return drills;
  }
  const easy = unique.filter((exercise) => exercise.difficulty === 'E');
  if (easy.length > 0) {
    return easy;
  }
  return unique;
}

export function pickDailyDrill(
  pool: DrillCandidate[],
  dateKey: string,
): DrillCandidate | null {
  if (pool.length === 0) {
    return null;
  }
  const index = ((dayOrdinal(dateKey) % pool.length) + pool.length) % pool.length;
  return pool[index] ?? null;
}
