import { z } from 'zod';
import { aiCategorySchema } from '../../common/constants/aiCategories';

export const createInstructorCourseSchema = z
  .object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    category: aiCategorySchema,
    topics: z.array(z.string().min(1)).min(1),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    priceCents: z.number().int().min(0),
    currency: z.string().length(3).optional(),
    visualsPreferred: z.boolean().optional(),
    dailyNotification: z.boolean().optional(),
  })
  .strict();

export const updateInstructorCourseSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    category: aiCategorySchema.optional(),
    topics: z.array(z.string().min(1)).min(1).optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    priceCents: z.number().int().min(0).optional(),
    currency: z.string().length(3).optional(),
  })
  .strict();

export const updateStructureTitleSchema = z
  .object({
    title: z.string().min(1).max(300),
  })
  .strict();

export const reorderStructureSchema = z
  .object({
    moduleOrder: z.array(z.string().min(1)),
    lessonsByModule: z.record(z.string(), z.array(z.string().min(1))),
  })
  .strict();

const instructorLessonVisualSchema = z
  .object({
    type: z.enum(['diagram', 'timeline', 'comparison', 'flowchart', 'infographic']),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    elements: z.array(z.string().min(1).max(200)).max(12).optional(),
  })
  .nullable()
  .optional();

export const updateLessonContentSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    content: z.object({
      summary: z.string().max(8000).optional(),
      sections: z
        .array(
          z.object({
            title: z.string().min(1).max(200),
            body: z.string().min(1).max(30000),
            visual: instructorLessonVisualSchema,
          }),
        )
        .max(20),
      keyPoints: z.array(z.string().min(1).max(500)).max(20),
    }),
  })
  .strict();

export const setUserRoleSchema = z
  .object({
    role: z.enum(['user', 'admin', 'instructor']),
  })
  .strict();
