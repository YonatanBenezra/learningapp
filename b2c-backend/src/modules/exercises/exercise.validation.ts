import { z } from 'zod';

// submissionData is free-form (code / commands / config), validated per-lab in §9.
export const submitExerciseSchema = z
  .object({
    submissionData: z.unknown(),
  })
  .strict();
