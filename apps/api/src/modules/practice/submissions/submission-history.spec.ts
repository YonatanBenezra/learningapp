import type { PrismaService } from '../../../core/prisma/prisma.service';
import {
  listSubmissionHistory,
  SUBMISSION_HISTORY_LIMIT,
} from './submissions.service';

describe('listSubmissionHistory', () => {
  it("returns only the learner's own rows, newest first, without failing cases", async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 's2',
        createdAt: new Date('2026-11-16T10:00:00Z'),
        payload: { topK: 2, rerank: true, chunkSize: 200 },
        attempt: { contestEntryId: null },
        runs: [
          {
            id: 'r2',
            status: 'succeeded',
            startedAt: null,
            finishedAt: null,
            grade: {
              verdict: 'pass',
              gateResults: [{ metric: 'recall@k' }],
              metrics: {},
            },
          },
        ],
      },
      {
        id: 's1',
        createdAt: new Date('2026-11-16T09:00:00Z'),
        payload: { topK: 20, rerank: false, chunkSize: 400 },
        attempt: { contestEntryId: 'entry-1' },
        runs: [],
      },
    ]);
    const prisma = {
      submission: { findMany },
    } as unknown as PrismaService;

    const rows = await listSubmissionHistory(prisma, 'user-1', 'rag-017');

    const query = (
      findMany.mock.calls[0] as [
        { where: unknown; orderBy: unknown; take: number; select: unknown },
      ]
    )[0];
    expect(query.where).toEqual({
      attempt: { userId: 'user-1', exercise: { slug: 'rag-017' } },
    });
    expect(query.orderBy).toEqual({ createdAt: 'desc' });
    expect(query.take).toBe(SUBMISSION_HISTORY_LIMIT);
    expect(JSON.stringify(query.select)).not.toContain('failingCases');

    expect(rows.map((row) => row.submissionId)).toEqual(['s2', 's1']);
    expect(rows[0].grade?.verdict).toBe('pass');
    expect(rows[1]).toMatchObject({ contest: true, run: null, grade: null });
  });
});
