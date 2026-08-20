import { z } from 'zod';
import { AI_CATEGORY_NAMES } from '@aieng/shared';

export const listProblemsQuerySchema = z
  .object({
    topic: z.enum(AI_CATEGORY_NAMES).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  })
  .strict();

export const nextProblemQuerySchema = z
  .object({
    exclude: z
      .string()
      .optional()
      .transform((v) =>
        v
          ? v
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      ),
  })
  .strict();

export const submitProblemSchema = z
  .object({
    guestSessionId: z.string().uuid(),
    answer: z.string().min(1),
    completedCount: z.number().int().min(0).optional(),
    clientSubmissionId: z.string().uuid().optional(),
  })
  .strict();

const skillTopicStatsSchema = z.object({
  attempted: z.number().int().min(0),
  passed: z.number().int().min(0),
  avgScore: z.number().min(0).max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
});

const guestSubmissionSchema = z.object({
  problemSlug: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
  type: z.string().min(1),
  answer: z.string(),
  score: z.number().min(0).max(100),
  correct: z.boolean(),
  feedback: z.string(),
  submittedAt: z.string().datetime(),
  clientSubmissionId: z.string().uuid().optional(),
});

export const syncPracticeSchema = z
  .object({
    version: z.literal(1),
    guestSessionId: z.string().uuid(),
    freeLimit: z.number().int().min(1),
    completedCount: z.number().int().min(0),
    synced: z.boolean(),
    lastProblemSlug: z.string().optional(),
    submissions: z.array(guestSubmissionSchema),
    skillByTopic: z.record(skillTopicStatsSchema),
    completedSlugs: z.array(z.string()),
  })
  .strict();

export type SyncPracticePayload = z.infer<typeof syncPracticeSchema>;
