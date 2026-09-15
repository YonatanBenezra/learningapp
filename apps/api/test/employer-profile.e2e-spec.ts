import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ContestKind } from '@prisma/client';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  HIDDEN_EVAL_CANARY,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

describe('Employer profile (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('shows only opted-in verified results and hides learner identifiers', async () => {
    const cookies = await signIn(app, `employer-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const userId = me.body.id as string;
    await prisma.account.update({
      where: { userId },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });

    const slug = `employer-${Date.now()}`;
    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', cookies)
      .send({ displayName: 'Employer Test', slug, enabled: true })
      .expect(200);

    const contest = await prisma.contest.findFirst({
      where: { kind: ContestKind.assessment },
    });
    if (!contest) {
      return;
    }

    const entry = await prisma.contestEntry.create({
      data: {
        contestId: contest.id,
        userId,
        status: 'finished',
        sampleSeed: 'employer-e2e',
        sampledSlugs: [],
        totalScore: 320,
        elapsedMs: 1_800_000,
        finishedAt: new Date(),
      },
    });

    const shared = await prisma.signedAssessmentResult.create({
      data: {
        contestEntryId: entry.id,
        userId,
        assessmentSlug: contest.slug,
        payload: {
          v: 1,
          resultId: '00000000-0000-4000-8000-000000000001',
          assessmentSlug: contest.slug,
          seasonKey: '2026-Q3',
          issuedAt: new Date().toISOString(),
          band: 'verified',
          bandLabel: 'Verified',
          totalScore: 320,
          maxScore: 400,
          elapsedMs: 1_800_000,
          timeBoxMinutes: 90,
          sampleCount: 4,
          sampleSeed: 'seed',
          window: {
            startsAt: '2026-07-01T00:00:00.000Z',
            endsAt: '2026-09-30T23:59:59.000Z',
          },
          items: [],
          skills: [{ slug: 'chunking', name: 'Chunking', score: 80, problems: 1 }],
        },
        signature: 'dGVzdA==',
        keyId: 'test-key',
        sharedPublicAt: new Date(),
      },
    });

    const profile = await request(app.getHttpServer())
      .get(`/api/profiles/${slug}`)
      .expect(200);

    expect(profile.body.verifiedResults).toHaveLength(1);
    expect(profile.body.verifiedResults[0]).toMatchObject({
      id: shared.id,
      bandLabel: 'Verified',
    });

    const serialized = JSON.stringify(profile.body);
    expect(serialized).not.toContain(me.body.email);
    expect(serialized).not.toContain(userId);
    expect(serialized).not.toContain(HIDDEN_EVAL_CANARY);
    expect(serialized).not.toContain('signature');
    expect(serialized).not.toContain('sampleSeed');
  });

  it('lets learners share and unshare results', async () => {
    const cookies = await signIn(app, `share-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const userId = me.body.id as string;

    const row = await prisma.signedAssessmentResult.findFirst({
      where: { userId: me.body.id as string },
      orderBy: { issuedAt: 'desc' },
    });
    if (!row) {
      const contest = await prisma.contest.findFirst({
        where: { kind: ContestKind.assessment },
      });
      if (!contest) {
        return;
      }
      const entry = await prisma.contestEntry.create({
        data: {
          contestId: contest.id,
          userId,
          status: 'finished',
          sampleSeed: 'share-e2e',
          sampledSlugs: [],
          totalScore: 100,
          elapsedMs: 60_000,
          finishedAt: new Date(),
        },
      });
      await prisma.signedAssessmentResult.create({
        data: {
          contestEntryId: entry.id,
          userId,
          assessmentSlug: contest.slug,
          payload: {
            v: 1,
            resultId: '00000000-0000-4000-8000-000000000003',
            assessmentSlug: contest.slug,
            seasonKey: '2026-Q3',
            issuedAt: new Date().toISOString(),
            band: 'foundation',
            bandLabel: 'Foundation',
            totalScore: 100,
            maxScore: 400,
            elapsedMs: 60_000,
            timeBoxMinutes: 90,
            sampleCount: 4,
            sampleSeed: 'seed',
            window: {
              startsAt: '2026-07-01T00:00:00.000Z',
              endsAt: '2026-09-30T23:59:59.000Z',
            },
            items: [],
            skills: [],
          },
          signature: 'dGVzdA==',
          keyId: 'test-key',
        },
      });
    }

    const list = await request(app.getHttpServer())
      .get('/api/me/assessments/results')
      .set('Cookie', cookies)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    const target = list.body[0] as { id: string; shared: boolean };
    expect(target.id).toBeTruthy();

    const shared = await request(app.getHttpServer())
      .patch(`/api/me/assessments/results/${target.id}/share`)
      .set('Cookie', cookies)
      .send({ shared: true })
      .expect(200);
    expect(shared.body.shared).toBe(true);

    const unshared = await request(app.getHttpServer())
      .patch(`/api/me/assessments/results/${target.id}/share`)
      .set('Cookie', cookies)
      .send({ shared: false })
      .expect(200);
    expect(unshared.body.shared).toBe(false);
  });
});
