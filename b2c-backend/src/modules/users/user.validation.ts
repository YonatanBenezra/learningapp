import { z } from 'zod';

export const updatePreferencesSchema = z
  .object({
    visualsPreferred: z.boolean().optional(),
    dailyNotification: z.boolean().optional(),
    timezone: z.string().min(1).optional(),
  })
  .strict();
