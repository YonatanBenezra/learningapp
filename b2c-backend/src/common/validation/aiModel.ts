import { z } from 'zod';

export const aiModelSlug = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[\w./+-]+$/, 'Invalid model id');

export const optionalAiModel = aiModelSlug.nullable().optional();
