import type { AiUsage } from './types';

export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

// USD per 1M tokens (OpenRouter reference pricing). Unknown models fall back to Sonnet 4.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'anthropic/claude-opus-4': { inputPerMTok: 15, outputPerMTok: 75 },
  'anthropic/claude-sonnet-4': { inputPerMTok: 3, outputPerMTok: 15 },
  'anthropic/claude-haiku-4': { inputPerMTok: 0.8, outputPerMTok: 4 },
  'openai/gpt-4o': { inputPerMTok: 2.5, outputPerMTok: 10 },
  'openai/gpt-4o-mini': { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  'google/gemini-2.5-pro-preview': { inputPerMTok: 1.25, outputPerMTok: 10 },
};

const FALLBACK = MODEL_PRICING['anthropic/claude-sonnet-4'];

export function estimateCostUsd(model: string, usage: AiUsage): number {
  const pricing = MODEL_PRICING[model] ?? FALLBACK;
  const input = (usage.inputTokens / 1_000_000) * pricing.inputPerMTok;
  const output = (usage.outputTokens / 1_000_000) * pricing.outputPerMTok;
  return input + output;
}
