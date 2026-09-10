/**
 * Skill decay — Phase 3 Step 2 (O13).
 *
 * Spec §8: "Decays — a skill unpractised for 6 months fades."
 *
 * Derived at read time from `UserSkillScore.lastPracticedAt`. No cron, no
 * backfill, no re-grade: the stored score stays exactly what grading wrote.
 * Leaderboard rank and contest rating are deliberately NOT decayed.
 */

/** Days for a score to fall to half of its stored value. */
export const SKILL_DECAY_HALF_LIFE_DAYS = 180;

/** A demonstrated skill never reads as zero — it reads as stale. */
export const SKILL_DECAY_FLOOR_RATIO = 0.25;

/**
 * When a radar surface starts naming the reason ("last practised 7 months
 * ago"). Presentation only — not part of the locked curve.
 */
export const SKILL_DECAY_STALE_AFTER_DAYS = 90;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type SkillScoreRow = {
  score: number;
  lastPracticedAt: Date | null;
};

export type DecayedSkillScore = {
  /** Decayed — the value a radar surface should display. */
  score: number;
  /** Exactly what grading stored, undecayed. */
  rawScore: number;
  /** Null when the row has never recorded a practice date. */
  daysSincePractice: number | null;
  /** True once the surface should explain the gap. */
  stale: boolean;
};

export function daysSince(
  lastPracticedAt: Date | null,
  now: Date,
): number | null {
  if (!lastPracticedAt) {
    return null;
  }
  const elapsed = now.getTime() - lastPracticedAt.getTime();
  // Clock skew must never inflate a score.
  return Math.max(0, Math.floor(elapsed / MS_PER_DAY));
}

/** Exponential decay clamped at the floor. 1 with no practice date. */
export function decayMultiplier(days: number | null): number {
  if (days === null || days <= 0) {
    return 1;
  }
  const raw = Math.pow(0.5, days / SKILL_DECAY_HALF_LIFE_DAYS);
  return Math.max(raw, SKILL_DECAY_FLOOR_RATIO);
}

export function decaySkillScore(
  row: SkillScoreRow,
  now: Date = new Date(),
): DecayedSkillScore {
  const days = daysSince(row.lastPracticedAt, now);
  const decayed = row.score * decayMultiplier(days);
  return {
    score: Math.round(decayed * 10000) / 10000,
    rawScore: row.score,
    daysSincePractice: days,
    stale: days !== null && days >= SKILL_DECAY_STALE_AFTER_DAYS,
  };
}

export type SkillScoreView = DecayedSkillScore & {
  slug: string;
  name: string;
};

/** Shared radar row for `/api/me/progress` and `/api/u/:slug`. */
export function toSkillScoreView(
  row: SkillScoreRow & { skill: { slug: string; name: string } },
  now: Date = new Date(),
): SkillScoreView {
  return {
    slug: row.skill.slug,
    name: row.skill.name,
    ...decaySkillScore(row, now),
  };
}
