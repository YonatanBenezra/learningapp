import { z } from 'zod';

export const AI_CATEGORY_NAMES = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Data Science',
  'Natural Language Processing',
  'Computer Vision',
  'Generative AI',
  'Prompt Engineering',
] as const;

export type AiCategoryName = (typeof AI_CATEGORY_NAMES)[number];

export const aiCategorySchema = z.enum(AI_CATEGORY_NAMES);

export const AI_SKILL_TOPICS = AI_CATEGORY_NAMES;

export type AiSkillTopic = AiCategoryName;
