import { z } from 'zod';
import { optionalAiModel } from '../../common/validation/aiModel';

// Onboarding config (§1.2) that triggers async course generation.
export const createCourseSchema = z
  .object({
    category: z.string().min(1),
    topics: z.array(z.string().min(1)).min(1),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    visualsPreferred: z.boolean().optional(),
    dailyNotification: z.boolean().optional(),
    aiModel: optionalAiModel,
  })
  .strict();
