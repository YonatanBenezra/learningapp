// Central AI tuning. Default model is Claude Opus 4.8 — do not downgrade without
// an explicit product decision (§15.3 provider/cost). Retry is owned by AiClient,
// so the provider's own SDK retries are disabled.
export const AI_CONFIG = {
  defaultModel: 'claude-opus-4-8',
  defaultMaxTokens: 8000,
  timeoutMs: 120_000,
  maxRetries: 2,
  baseRetryDelayMs: 500,
} as const;
