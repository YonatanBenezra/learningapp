import { z } from 'zod';
import { DEFAULT_PLATFORM_CHAT_MODEL, isAllowedPlatformChatModel } from './platformChat.models';

export const platformChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(24),
  model: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isAllowedPlatformChatModel(value), {
      message: 'Unsupported chat model',
    }),
});

export type PlatformChatInput = z.infer<typeof platformChatSchema>;

export const platformChatDefaultModel = DEFAULT_PLATFORM_CHAT_MODEL;
