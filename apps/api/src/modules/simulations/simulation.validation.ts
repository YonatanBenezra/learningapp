import { z } from 'zod';

export const listSimulationsQuerySchema = z
  .object({
    topic: z.string().trim().min(1).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  })
  .strict();

export const simulationActionBodySchema = z
  .object({
    prompt: z.string().trim().min(1).max(4000).optional(),
    query: z.string().trim().min(1).max(500).optional(),
    topK: z.number().int().min(1).max(5).optional(),
    selectedChunkId: z.string().trim().min(1).max(64).optional(),
    chunkSize: z.enum(['small', 'medium', 'large']).optional(),
    rerank: z.boolean().optional(),
    userInput: z.string().trim().min(1).max(500).optional(),
    inputFilter: z.boolean().optional(),
    safetySystemPrompt: z.boolean().optional(),
    outputValidation: z.boolean().optional(),
    modelOutput: z.string().trim().max(8000).optional(),
    guestSessionId: z.string().uuid().optional(),
  })
  .strict();
