import { env } from '../../config/env';

// Central AI tuning. Default model is configured via OPENROUTER_MODEL.
// Retry is owned by AiClient — the provider does not retry internally.
export const AI_CONFIG = {
  defaultModel: env.openRouterModel,
  embeddingModel: 'openai/text-embedding-3-small',
  defaultMaxTokens: 8000,
  timeoutMs: 120_000,
  maxRetries: 2,
  baseRetryDelayMs: 500,
} as const;
