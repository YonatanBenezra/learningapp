import { z } from 'zod';

export const createInstructorCourseSchema = z
  .object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    category: z.string().min(1),
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
    category: z.string().min(1).optional(),
    topics: z.array(z.string().min(1)).min(1).optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    priceCents: z.number().int().min(0).optional(),
    currency: z.string().length(3).optional(),
  })
  .strict();

export const setUserRoleSchema = z
  .object({
    role: z.enum(['user', 'admin', 'instructor']),
  })
  .strict();
