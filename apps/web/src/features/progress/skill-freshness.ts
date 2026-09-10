import type { SkillScore } from "@/types/progress";

/**
 * Names why a skill score reads lower than it was earned.
 * Null when there is nothing to explain.
 */
export function skillStaleNote(skill: SkillScore): string | null {
  if (!skill.stale || skill.daysSincePractice === null) {
    return null;
  }
  const days = skill.daysSincePractice;
  if (days >= 365) {
    return "last practised over a year ago";
  }
  const months = Math.max(1, Math.round(days / 30));
  return `last practised ${months} month${months === 1 ? "" : "s"} ago`;
}

/** Track widths for a decayed bar: the earned score, and what is left of it. */
export function skillBarWidths(skill: SkillScore): {
  raw: number;
  fill: number;
} {
  const raw = Math.max(0, Math.min(skill.rawScore, 1));
  const decayed = Math.max(0, Math.min(skill.score, 1));
  return {
    raw: raw * 100,
    fill: raw > 0 ? Math.min(decayed / raw, 1) * 100 : 0,
  };
}
