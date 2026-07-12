// Single shared AI wrapper (§2.5.1). Every module (courses, exercises, assessments)
// calls THROUGH this — never the Anthropic SDK directly. Centralizes retry/backoff,
// cost/token accounting, and provider swapping.
import type { ZodType } from 'zod';
import { AiError } from './ai.error';
import { estimateCostUsd } from './pricing';
import { AI_CONFIG } from './ai.config';
import { AnthropicProvider } from './provider';
import { MongoUsageRecorder, logUsage, type UsageRecorder, type AiUsageEntry } from './usageRecorder';
import { logger } from '../../common/utils/logger';
import type { AiProvider, AiGenerateRequest, AiTextResult, AiStructuredResult } from './types';

export interface AiCallOptions extends AiGenerateRequest {
  useCase?: string;
  userId?: string | null;
}

export interface AiClientOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export class AiClient {
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly provider: AiProvider,
    private readonly recorder: UsageRecorder,
    options: AiClientOptions = {},
  ) {
    this.maxRetries = options.maxRetries ?? AI_CONFIG.maxRetries;
    this.baseDelayMs = options.baseDelayMs ?? AI_CONFIG.baseRetryDelayMs;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async complete(opts: AiCallOptions): Promise<AiTextResult & { costUsd: number }> {
    const result = await this.withRetry(() => this.provider.generateText(opts));
    const costUsd = estimateCostUsd(result.model, result.usage);
    await this.track({
      useCase: opts.useCase ?? 'other',
      userId: opts.userId ?? null,
      model: result.model,
      usage: result.usage,
      costUsd,
    });
    return { ...result, costUsd };
  }

  async completeStructured<T>(
    opts: AiCallOptions,
    schema: ZodType<T>,
  ): Promise<AiStructuredResult<T> & { costUsd: number }> {
    const result = await this.withRetry(() => this.provider.generateStructured(opts, schema));

    // Defense in depth: re-validate the provider's output against the schema.
    const parsed = schema.safeParse(result.data);
    if (!parsed.success) {
      throw new AiError('AI structured output failed schema validation', false, parsed.error);
    }

    const costUsd = estimateCostUsd(result.model, result.usage);
    await this.track({
      useCase: opts.useCase ?? 'other',
      userId: opts.userId ?? null,
      model: result.model,
      usage: result.usage,
      costUsd,
    });
    return { ...result, data: parsed.data, costUsd };
  }

  private async withRetry<R>(fn: () => Promise<R>): Promise<R> {
    let attempt = 0;
    for (;;) {
      try {
        return await fn();
      } catch (err) {
        const aiErr = err instanceof AiError ? err : new AiError('AI call failed', false, err);
        if (!aiErr.retryable || attempt >= this.maxRetries) throw aiErr;
        const jitter = Math.floor(Math.random() * this.baseDelayMs);
        await this.sleep(this.baseDelayMs * 2 ** attempt + jitter);
        attempt += 1;
      }
    }
  }

  private async track(entry: AiUsageEntry): Promise<void> {
    logUsage(entry);
    try {
      await this.recorder.record(entry);
    } catch (err) {
      // Never fail an AI call because usage persistence failed.
      logger.warn({ err }, 'Failed to persist AI usage');
    }
  }
}

let singleton: AiClient | null = null;

// Lazily-constructed default client (Anthropic + Mongo-backed usage recording).
export function getAiClient(): AiClient {
  if (!singleton) {
    singleton = new AiClient(new AnthropicProvider(), new MongoUsageRecorder());
  }
  return singleton;
}
