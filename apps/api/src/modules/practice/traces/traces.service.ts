import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountTier } from '@prisma/client';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { readTraceBlob } from '../../../common/utils/trace-blob';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccountService } from '../../accounts/account.service';
import { GATED_TRACE_MESSAGE } from '../../accounts/account.quota';

const FREE_TRACE_KEYS = [
  'simulator',
  'tokensIn',
  'tokensOut',
  'costEurMicros',
  'k',
  'chunkCount',
] as const;

@Injectable()
export class TracesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
  ) {}

  async getByRunId(user: AuthenticatedUser, runId: string) {
    const run = await this.prisma.run.findFirst({
      where: { id: runId, submission: { attempt: { userId: user.id } } },
      include: { trace: true },
    });
    if (!run) {
      throw new NotFoundException('Run not found');
    }
    if (!run.trace) {
      throw new NotFoundException('Trace not ready');
    }
    const blob = await readTraceBlob(run.trace.blobUri);
    const body =
      blob && typeof blob === 'object' ? (blob as Record<string, unknown>) : {};
    const usage = await this.accounts.usageFor(user.id);
    if (usage.tier !== AccountTier.pro) {
      return gateFreeTrace(runId, run.trace.createdAt, body);
    }
    if (JSON.stringify(body).includes('HIDDEN_EVAL')) {
      return {
        runId,
        createdAt: run.trace.createdAt,
        ...body,
        queries: [],
      };
    }
    return {
      runId,
      createdAt: run.trace.createdAt,
      ...body,
    };
  }
}

function gateFreeTrace(
  runId: string,
  createdAt: Date,
  body: Record<string, unknown>,
) {
  const summary: Record<string, unknown> = {
    runId,
    createdAt,
    gated: true,
    message: GATED_TRACE_MESSAGE,
  };
  for (const key of FREE_TRACE_KEYS) {
    if (key in body) {
      summary[key] = body[key];
    }
  }
  return summary;
}
