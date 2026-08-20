import { AI_SKILL_TOPICS, type AiSkillTopic } from '../../common/constants/aiCategories';
import { TIER_LIMITS, tierLimits } from '../../config/tiers';

export const SKILL_TOPICS = AI_SKILL_TOPICS;

export type SkillTopic = AiSkillTopic;

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export function scoreToLevel(score: number): SkillLevel {
  if (score >= 90) return 'Expert';
  if (score >= 70) return 'Advanced';
  if (score >= 40) return 'Intermediate';
  return 'Beginner';
}

export const FREE_SKILL_ASSESSMENT_LIMIT = TIER_LIMITS.free.activeAssessments;

export function skillAssessmentLimitFor(tier?: string | null): number {
  return tierLimits(tier).activeAssessments;
}
