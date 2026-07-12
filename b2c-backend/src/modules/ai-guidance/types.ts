import type { ZodType } from 'zod';

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
}

export interface AiGenerateRequest {
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface AiTextResult {
  text: string;
  model: string;
  usage: AiUsage;
  stopReason: string | null;
}

export interface AiStructuredResult<T> {
  data: T;
  model: string;
  usage: AiUsage;
  stopReason: string | null;
}

// Provider-agnostic seam (§2.5.1). Swap AnthropicProvider for another provider
// without touching callers or the AiClient.
export interface AiProvider {
  generateText(req: AiGenerateRequest): Promise<AiTextResult>;
  generateStructured<T>(req: AiGenerateRequest, schema: ZodType<T>): Promise<AiStructuredResult<T>>;
}
