import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hashToken } from '../../../common/utils/token-hash';
import {
  readGenCacheBlob,
  writeGenCacheBlob,
} from '../../../common/utils/gen-cache-blob';
import { canonicalJson } from '../../../common/validation/json-schema';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  asRecord,
  BudgetEnforcer,
  numberField,
} from '../budget/budget.enforcer';
import {
  costEurMicros,
  estimateTokens,
  PINNED_EMBED_MODEL,
  PINNED_GEN_MODEL,
  PINNED_JUDGE_MODEL,
} from './pricing';

export type GatewayCompleteInput = {
  runId: string;
  prompt: string;
  params?: Record<string, unknown>;
};

export type GatewayJudgeInput = {
  runId: string;
  rubric: string;
  output: string;
};

export type GatewayEmbedInput = {
  runId: string;
  text: string;
};

export type GatewayCompleteResult = {
  text: string;
  modelVersion: string;
  tokensIn: number;
  tokensOut: number;
  costEurMicros: number;
  cacheHit: boolean;
};

export type GatewayEmbedResult = {
  embedding: number[];
  modelVersion: string;
  tokensIn: number;
  tokensOut: number;
  costEurMicros: number;
  cacheHit: boolean;
};

@Injectable()
export class ModelGateway {
  private readonly logger = new Logger(ModelGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly budget: BudgetEnforcer,
  ) {}

  async complete(input: GatewayCompleteInput): Promise<GatewayCompleteResult> {
    const modelVersion = PINNED_GEN_MODEL;
    const promptHash = hashToken(input.prompt);
    const paramsHash = hashToken(canonicalJson(input.params ?? {}));
    const cached = await this.prisma.genCache.findUnique({
      where: {
        modelVersion_promptHash_paramsHash: {
          modelVersion,
          promptHash,
          paramsHash,
        },
      },
    });
    if (cached) {
      await this.recordCacheHit(cached.id, 'gen');
      await this.touchRun(input.runId, { cacheHit: true, modelVersion });
      const blob = (await readGenCacheBlob(cached.blobUri)) as {
        text?: unknown;
      };
      const text = typeof blob.text === 'string' ? blob.text : '';
      this.logger.log(`gen cache hit model=${modelVersion} run=${input.runId}`);
      return {
        text,
        modelVersion,
        tokensIn: 0,
        tokensOut: 0,
        costEurMicros: 0,
        cacheHit: true,
      };
    }

    const fake = fakeCompletion(input.prompt);
    const tokensIn = estimateTokens(input.prompt);
    const tokensOut = estimateTokens(fake);
    const micros = costEurMicros(tokensIn, tokensOut);
    await this.budget.assertWithinBudget(input.runId, {
      calls: 1,
      tokens: tokensIn + tokensOut,
      costEurMicros: micros,
    });

    const blobUri = await writeGenCacheBlob(
      `${promptHash.slice(0, 24)}-${paramsHash.slice(0, 8)}`,
      { text: fake },
    );
    await this.prisma.genCache.create({
      data: { modelVersion, promptHash, paramsHash, blobUri, hits: 0 },
    });
    await this.touchRun(input.runId, {
      cacheHit: false,
      modelVersion,
      tokensIn,
      tokensOut,
      costEurMicros: micros,
    });
    this.logger.log(
      `gen model=${modelVersion} run=${input.runId} tokens=${tokensIn + tokensOut} micros=${micros}`,
    );
    return {
      text: fake,
      modelVersion,
      tokensIn,
      tokensOut,
      costEurMicros: micros,
      cacheHit: false,
    };
  }

  async judge(input: GatewayJudgeInput): Promise<GatewayCompleteResult> {
    const judgeVersion = PINNED_JUDGE_MODEL;
    const rubricHash = hashToken(input.rubric);
    const outputHash = hashToken(input.output);
    const cached = await this.prisma.judgeCache.findUnique({
      where: {
        judgeVersion_rubricHash_outputHash: {
          judgeVersion,
          rubricHash,
          outputHash,
        },
      },
    });
    if (cached) {
      await this.prisma.judgeCache.update({
        where: { id: cached.id },
        data: { hits: { increment: 1 } },
      });
      await this.touchRun(input.runId, {
        cacheHit: true,
        modelVersion: judgeVersion,
      });
      const text = judgeText(cached.verdict);
      this.logger.log(
        `judge cache hit model=${judgeVersion} run=${input.runId}`,
      );
      return {
        text,
        modelVersion: judgeVersion,
        tokensIn: 0,
        tokensOut: 0,
        costEurMicros: 0,
        cacheHit: true,
      };
    }

    const prompt = `${input.rubric}\n---\n${input.output}`;
    const fake = fakeJudge(input.output);
    const tokensIn = estimateTokens(prompt);
    const tokensOut = estimateTokens(fake);
    const micros = costEurMicros(tokensIn, tokensOut);
    await this.budget.assertWithinBudget(input.runId, {
      calls: 1,
      tokens: tokensIn + tokensOut,
      costEurMicros: micros,
    });
    await this.prisma.judgeCache.create({
      data: {
        judgeVersion,
        rubricHash,
        outputHash,
        verdict: { text: fake },
        hits: 0,
      },
    });
    await this.touchRun(input.runId, {
      cacheHit: false,
      modelVersion: judgeVersion,
      tokensIn,
      tokensOut,
      costEurMicros: micros,
    });
    this.logger.log(
      `judge model=${judgeVersion} run=${input.runId} tokens=${tokensIn + tokensOut} micros=${micros}`,
    );
    return {
      text: fake,
      modelVersion: judgeVersion,
      tokensIn,
      tokensOut,
      costEurMicros: micros,
      cacheHit: false,
    };
  }

  async embed(input: GatewayEmbedInput): Promise<GatewayEmbedResult> {
    const completed = await this.complete({
      runId: input.runId,
      prompt: input.text,
      params: { task: 'embed', model: PINNED_EMBED_MODEL },
    });
    return {
      embedding: fakeEmbedding(input.text),
      modelVersion: PINNED_EMBED_MODEL,
      tokensIn: completed.tokensIn,
      tokensOut: 0,
      costEurMicros: completed.costEurMicros,
      cacheHit: completed.cacheHit,
    };
  }

  private async recordCacheHit(
    id: string,
    kind: 'gen' | 'judge',
  ): Promise<void> {
    if (kind === 'gen') {
      await this.prisma.genCache.update({
        where: { id },
        data: { hits: { increment: 1 } },
      });
    }
  }

  private async touchRun(
    runId: string,
    update: {
      cacheHit: boolean;
      modelVersion: string;
      tokensIn?: number;
      tokensOut?: number;
      costEurMicros?: number;
    },
  ): Promise<void> {
    const run = await this.prisma.run.findUniqueOrThrow({
      where: { id: runId },
    });
    const versions = asRecord(run.modelVersions);
    const calls = numberField(versions.calls) + (update.cacheHit ? 0 : 1);
    const cacheHits =
      numberField(versions.cacheHits) + (update.cacheHit ? 1 : 0);
    const denom = calls + cacheHits;
    await this.prisma.run.update({
      where: { id: runId },
      data: {
        tokensIn: run.tokensIn + (update.tokensIn ?? 0),
        tokensOut: run.tokensOut + (update.tokensOut ?? 0),
        costEurMicros: run.costEurMicros + BigInt(update.costEurMicros ?? 0),
        cacheHitRatio: denom === 0 ? 0 : cacheHits / denom,
        modelVersions: {
          ...versions,
          pinned: update.modelVersion,
          calls,
          cacheHits,
        },
      },
    });
  }
}

function fakeCompletion(prompt: string): string {
  return `FAKE:${hashToken(prompt).slice(0, 12)}:${prompt.length}`;
}

function fakeJudge(output: string): string {
  return `FAKE_JUDGE:${hashToken(output).slice(0, 8)}`;
}

function fakeEmbedding(text: string): number[] {
  const digest = hashToken(text);
  const values: number[] = [];
  for (let i = 0; i < 8; i += 1) {
    values.push(parseInt(digest.slice(i * 4, i * 4 + 4), 16) / 0xffff);
  }
  return values;
}

function judgeText(verdict: Prisma.JsonValue): string {
  if (verdict && typeof verdict === 'object' && !Array.isArray(verdict)) {
    const text = (verdict as Record<string, unknown>).text;
    if (typeof text === 'string') {
      return text;
    }
  }
  return '';
}
