import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { readTraceBlob } from '../../../common/utils/trace-blob';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class TracesService {
  constructor(private readonly prisma: PrismaService) {}

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
