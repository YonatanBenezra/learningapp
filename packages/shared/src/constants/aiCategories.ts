/**
 * Canonical AI engineering categories for problems, assessments, and filters.
 * UI icons live in apps/web — names only in this shared package.
 */
export const AI_CATEGORY_NAMES = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Data Science',
  'Natural Language Processing',
  'Computer Vision',
  'Generative AI',
  'Prompt Engineering',
  'Large Language Models',
  'AI Agents',
  'MLOps',
  'Reinforcement Learning',
  'Robotics',
  'Responsible AI',
] as const;

export type AiCategoryName = (typeof AI_CATEGORY_NAMES)[number];

export const AI_CATEGORY_NAME_SET = new Set<string>(AI_CATEGORY_NAMES);

export function isAiCategory(value: string): value is AiCategoryName {
  return AI_CATEGORY_NAME_SET.has(value);
}
