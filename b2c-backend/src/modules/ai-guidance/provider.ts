import Anthropic from '@anthropic-ai/sdk';
import type { ZodType } from 'zod';
import { env } from '../../config/env';
import { AI_CONFIG } from './ai.config';
import { AiError } from './ai.error';
import type {
  AiProvider,
  AiGenerateRequest,
  AiTextResult,
  AiStructuredResult,
  AiUsage,
} from './types';

const JSON_DIRECTIVE =
  'Respond with a single valid JSON value and nothing else — no markdown fences, no commentary.';

interface RawUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

function toUsage(u: RawUsage): AiUsage {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheReadInputTokens: u.cache_read_input_tokens ?? 0,
    cacheCreationInputTokens: u.cache_creation_input_tokens ?? 0,
  };
}

export function wrapError(err: unknown): AiError {
  if (err instanceof AiError) return err;
  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0;
    const retryable =
      err instanceof Anthropic.RateLimitError ||
      err instanceof Anthropic.APIConnectionError ||
      status >= 500;
    return new AiError(`AI provider error (${status || 'network'}): ${err.message}`, retryable, err);
  }
  return new AiError('AI provider error', false, err);
}

// Robustly pull a JSON value out of a model response (tolerates code fences / stray prose).
export function extractJson(text: string): unknown {
  let body = text.trim();
  const fence = body.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence && fence[1]) body = fence[1].trim();
  try {
    return JSON.parse(body);
  } catch {
    const start = body.search(/[[{]/);
    const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new AiError('AI returned non-JSON output', false);
  }
}

// Concrete provider backed by the Anthropic SDK. The SDK client is created lazily
// so importing this module never touches credentials; SDK retries are disabled here
// (AiClient owns retry/backoff). Structured output is JSON-in-text; the AiClient
// validates it against the caller's zod schema.
export class AnthropicProvider implements AiProvider {
  private sdk: Anthropic | null = null;

  private client(): Anthropic {
    if (!this.sdk) {
      this.sdk = new Anthropic({
        ...(env.aiProviderApiKey ? { apiKey: env.aiProviderApiKey } : {}),
        maxRetries: 0,
        timeout: AI_CONFIG.timeoutMs,
      });
    }
    return this.sdk;
  }

  async generateText(req: AiGenerateRequest): Promise<AiTextResult> {
    try {
      const res = await this.client().messages.create({
        model: req.model ?? AI_CONFIG.defaultModel,
        max_tokens: req.maxTokens ?? AI_CONFIG.defaultMaxTokens,
        ...(req.system ? { system: req.system } : {}),
        messages: [{ role: 'user', content: req.prompt }],
      });
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      return { text, model: res.model, usage: toUsage(res.usage), stopReason: res.stop_reason };
    } catch (err) {
      throw wrapError(err);
    }
  }

  async generateStructured<T>(
    req: AiGenerateRequest,
    _schema: ZodType<T>,
  ): Promise<AiStructuredResult<T>> {
    const res = await this.generateText({
      ...req,
      system: req.system ? `${req.system}\n\n${JSON_DIRECTIVE}` : JSON_DIRECTIVE,
    });
    return {
      data: extractJson(res.text) as T,
      model: res.model,
      usage: res.usage,
      stopReason: res.stopReason,
    };
  }
}
