import { z } from 'zod';
import {
  AI_CATEGORY_NAMES,
  AI_CATEGORY_NAME_SET,
  isAiCategory,
  type AiCategoryName,
} from '@aieng/shared';

export { AI_CATEGORY_NAMES, AI_CATEGORY_NAME_SET, isAiCategory, type AiCategoryName };

export const aiCategorySchema = z.enum(AI_CATEGORY_NAMES);

export const AI_SKILL_TOPICS = AI_CATEGORY_NAMES;

export type AiSkillTopic = AiCategoryName;
