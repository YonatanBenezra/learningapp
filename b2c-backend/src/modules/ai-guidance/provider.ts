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

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

const JSON_DIRECTIVE =
  'Respond with a single valid JSON value and nothing else — no markdown fences, no commentary.';

interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface OpenRouterChatResponse {
  model?: string;
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: OpenRouterUsage;
  error?: { message?: string };
}

/** HTTP error from the OpenRouter API (used for retry classification in tests). */
export class ProviderHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ProviderHttpError';
  }
}

function toUsage(u: OpenRouterUsage | undefined): AiUsage {
  return {
    inputTokens: u?.prompt_tokens ?? 0,
    outputTokens: u?.completion_tokens ?? 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  };
}

export function wrapError(err: unknown): AiError {
  if (err instanceof AiError) return err;

  if (err instanceof ProviderHttpError) {
    const retryable = err.status === 429 || err.status >= 500;
    return new AiError(`AI provider error (${err.status}): ${err.message}`, retryable, err);
  }

  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return new AiError(`AI provider error (timeout): ${err.message}`, true, err);
    }
    if (err.message.toLowerCase().includes('fetch failed')) {
      return new AiError(`AI provider error (network): ${err.message}`, true, err);
    }
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

// OpenRouter provider (OpenAI-compatible chat completions API).
export class OpenRouterProvider implements AiProvider {
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      'Content-Type': 'application/json',
    };
    if (env.openRouterAppUrl) headers['HTTP-Referer'] = env.openRouterAppUrl;
    if (env.openRouterAppName) headers['X-Title'] = env.openRouterAppName;
    return headers;
  }

  private async chat(req: AiGenerateRequest, system?: string): Promise<AiTextResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

    try {
      const res = await fetch(OPENROUTER_CHAT_URL, {
        method: 'POST',
        headers: this.buildHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          model: req.model ?? env.openRouterModel,
          max_tokens: req.maxTokens ?? AI_CONFIG.defaultMaxTokens,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: req.prompt },
          ],
        }),
      });

      const body = (await res.json()) as OpenRouterChatResponse;

      if (!res.ok) {
        const message = body.error?.message ?? res.statusText ?? 'OpenRouter request failed';
        throw new ProviderHttpError(message, res.status);
      }

      const text = body.choices?.[0]?.message?.content ?? '';
      return {
        text,
        model: body.model ?? req.model ?? env.openRouterModel,
        usage: toUsage(body.usage),
        stopReason: body.choices?.[0]?.finish_reason ?? null,
      };
    } catch (err) {
      throw wrapError(err);
    } finally {
      clearTimeout(timer);
    }
  }

  async generateText(req: AiGenerateRequest): Promise<AiTextResult> {
    return this.chat(req, req.system);
  }

  async generateStructured<T>(
    req: AiGenerateRequest,
    _schema: ZodType<T>,
  ): Promise<AiStructuredResult<T>> {
    const system = req.system ? `${req.system}\n\n${JSON_DIRECTIVE}` : JSON_DIRECTIVE;
    const res = await this.chat(req, system);
    return {
      data: extractJson(res.text) as T,
      model: res.model,
      usage: res.usage,
      stopReason: res.stopReason,
    };
  }
}
