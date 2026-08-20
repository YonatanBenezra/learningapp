import { z } from 'zod';
import { optionalAiModel } from '../../common/validation/aiModel';

export const updatePreferencesSchema = z
  .object({
    visualsPreferred: z.boolean().optional(),
    dailyNotification: z.boolean().optional(),
    timezone: z.string().min(1).optional(),
    aiModel: optionalAiModel,
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    imageUrl: z.union([z.string().url().max(2048), z.literal('')]).optional(),
    address: z.string().trim().max(500).optional(),
    profession: z.string().trim().max(120).optional(),
    experience: z.string().trim().max(2000).optional(),
  })
  .strict();
