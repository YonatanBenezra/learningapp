import type { AiUsage } from './types';

export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

// USD per 1M tokens (Claude pricing reference). Unknown models fall back to Opus 4.8.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-8': { inputPerMTok: 5, outputPerMTok: 25 },
  'claude-opus-4-7': { inputPerMTok: 5, outputPerMTok: 25 },
  'claude-sonnet-5': { inputPerMTok: 3, outputPerMTok: 15 },
  'claude-haiku-4-5': { inputPerMTok: 1, outputPerMTok: 5 },
  'claude-fable-5': { inputPerMTok: 10, outputPerMTok: 50 },
};

const FALLBACK = MODEL_PRICING['claude-opus-4-8'];

export function estimateCostUsd(model: string, usage: AiUsage): number {
  const pricing = MODEL_PRICING[model] ?? FALLBACK;
  const input = (usage.inputTokens / 1_000_000) * pricing.inputPerMTok;
  const output = (usage.outputTokens / 1_000_000) * pricing.outputPerMTok;
  // Cache reads bill ~0.1x, cache writes ~1.25x of input price.
  const cacheRead = ((usage.cacheReadInputTokens ?? 0) / 1_000_000) * pricing.inputPerMTok * 0.1;
  const cacheWrite =
    ((usage.cacheCreationInputTokens ?? 0) / 1_000_000) * pricing.inputPerMTok * 1.25;
  return input + output + cacheRead + cacheWrite;
}
