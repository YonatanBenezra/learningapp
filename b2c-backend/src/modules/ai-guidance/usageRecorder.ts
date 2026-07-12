import { AiUsage as AiUsageModel } from './aiUsage.model';
import { logger } from '../../common/utils/logger';
import type { AiUsage } from './types';

export interface AiUsageEntry {
  userId?: string | null;
  useCase: string;
  model: string;
  usage: AiUsage;
  costUsd: number;
}

export interface UsageRecorder {
  record(entry: AiUsageEntry): Promise<void>;
}

// Persists usage for cost dashboards + quota accounting.
export class MongoUsageRecorder implements UsageRecorder {
  async record(entry: AiUsageEntry): Promise<void> {
    await AiUsageModel.create({
      userId: entry.userId ?? null,
      useCase: entry.useCase,
      model: entry.model,
      inputTokens: entry.usage.inputTokens,
      outputTokens: entry.usage.outputTokens,
      cacheReadInputTokens: entry.usage.cacheReadInputTokens ?? 0,
      cacheCreationInputTokens: entry.usage.cacheCreationInputTokens ?? 0,
      costUsd: entry.costUsd,
    });
  }
}

// Test double — captures entries in memory instead of hitting Mongo.
export class InMemoryUsageRecorder implements UsageRecorder {
  public readonly entries: AiUsageEntry[] = [];
  async record(entry: AiUsageEntry): Promise<void> {
    this.entries.push(entry);
  }
}

export function logUsage(entry: AiUsageEntry): void {
  logger.info(
    {
      useCase: entry.useCase,
      model: entry.model,
      inputTokens: entry.usage.inputTokens,
      outputTokens: entry.usage.outputTokens,
      costUsd: Number(entry.costUsd.toFixed(6)),
    },
    'AI usage',
  );
}
