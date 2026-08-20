import { z } from 'zod';
import { aiCategorySchema } from '../../common/constants/aiCategories';
import { optionalAiModel } from '../../common/validation/aiModel';
import { MIN_COURSE_TOPICS } from './course.constants';

// Onboarding config (§1.2) that triggers async course generation.
export const createCourseSchema = z
  .object({
    category: aiCategorySchema,
    topics: z.array(z.string().min(1)).min(MIN_COURSE_TOPICS),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    visualsPreferred: z.boolean().optional(),
    dailyNotification: z.boolean().optional(),
    aiModel: optionalAiModel,
  })
  .strict();
