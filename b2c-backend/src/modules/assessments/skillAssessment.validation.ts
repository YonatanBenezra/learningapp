import { z } from 'zod';
import { optionalAiModel } from '../../common/validation/aiModel';
import { SKILL_TOPICS } from './skillAssessment.constants';

export const generateSkillAssessmentSchema = z
  .object({
    topic: z.enum(SKILL_TOPICS),
    customTopic: z.string().trim().min(2).max(100).optional(),
    guestSessionId: z.string().uuid().optional(),
    aiModel: optionalAiModel,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.topic === 'Other' && !data.customTopic?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'customTopic is required when topic is Other',
        path: ['customTopic'],
      });
    }
  });

export const submitSkillAssessmentSchema = z
  .object({
    answers: z
      .array(
        z.object({
          questionIndex: z.number().int().min(0),
          answer: z.string(),
        }),
      )
      .min(1),
  })
  .strict();

export const listSkillAssessmentsQuerySchema = z
  .object({
    guestSessionId: z.string().uuid().optional(),
  })
  .strict();
