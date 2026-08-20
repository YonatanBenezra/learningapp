import type { SkillTopicStats } from '../types/guestPractice';

export function scoreToSkillLevel(avgScore: number): SkillTopicStats['level'] {
  if (avgScore >= 80) return 'advanced';
  if (avgScore >= 60) return 'intermediate';
  return 'beginner';
}

export function updateSkillStats(
  prev: SkillTopicStats | undefined,
  score: number,
  correct: boolean,
): SkillTopicStats {
  const attempted = (prev?.attempted ?? 0) + 1;
  const passed = (prev?.passed ?? 0) + (correct ? 1 : 0);
  const prevTotal = (prev?.avgScore ?? 0) * (prev?.attempted ?? 0);
  const avgScore = Math.round((prevTotal + score) / attempted);
  return {
    attempted,
    passed,
    avgScore,
    level: scoreToSkillLevel(avgScore),
  };
}
