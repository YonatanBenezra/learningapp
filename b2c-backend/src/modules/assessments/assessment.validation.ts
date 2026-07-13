import { z } from 'zod';

export const submitSchema = z
  .object({
    answers: z
      .array(
        z.object({
          questionIndex: z.number().int().min(0),
          answer: z.string(),
        }),
      )
      .default([]),
  })
  .strict();
