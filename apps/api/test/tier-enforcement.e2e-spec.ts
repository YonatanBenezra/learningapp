import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  R1_REFERENCE_PAYLOAD,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { HINT_UPGRADE_MESSAGE } from '../src/modules/accounts/account.quota';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';
import { seedR1Trace } from './seed-trace';

async function submitR1(
  app: INestApplication<App>,
  cookies: string,
  payload: Record<string, unknown>,
  expectedStatus = 201,
) {
  const started = await request(app.getHttpServer())
    .post('/api/attempts')
    .set('Cookie', cookies)
    .send({ exerciseSlug: R1_SLUG })
    .expect(201);
  return request(app.getHttpServer())
    .post(`/api/attempts/${started.body.id}/submissions`)
    .set('Cookie', cookies)
    .send({ payload })
    .expect(expectedStatus);
}

describe('Tier enforcement (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApiApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks a Free user at 3 graded attempts with an upgrade message', async () => {
    const cookies = await signIn(app, `quota-free-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: {
        attemptsThisPeriod: 3,
        periodStartedAt: new Date(),
      },
    });

    const blocked = await submitR1(app, cookies, R1_REFERENCE_PAYLOAD, 429);
    expect(blocked.body.message).toEqual(
      expect.objectContaining({
        code: 'quota_exceeded',
        upgradePath: '/billing',
      }),
    );
    expect(JSON.stringify(blocked.body)).toMatch(/3 free/);
    expect(JSON.stringify(blocked.body)).toMatch(/Upgrade to Pro/);

    const after = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(after.body.account).toMatchObject({
      tier: 'free',
      attemptsThisPeriod: 3,
      attemptsRemaining: 0,
      quotaExceeded: true,
      limits: { attemptsPerPeriod: 3, periodKind: 'calendar_week' },
    });
  });

  it('blocks a Pro user at the 60-attempt fair-use cap', async () => {
    const cookies = await signIn(app, `quota-pro-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: {
        tier: 'pro',
        subscriptionStatus: 'active',
        attemptsThisPeriod: 60,
        periodStartedAt: new Date(),
      },
    });

    const blocked = await submitR1(app, cookies, R1_REFERENCE_PAYLOAD, 429);
    expect(JSON.stringify(blocked.body)).toMatch(/60 graded/);
    const after = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(after.body.account).toMatchObject({
      tier: 'pro',
      attemptsRemaining: 0,
      quotaExceeded: true,
      limits: { attemptsPerPeriod: 60, periodKind: 'rolling_30d' },
    });
  });

  it('lets Free unlock the first hint and requires Pro for the rest', async () => {
    const cookies = await signIn(app, `hint-free-${Date.now()}@labpath.test`);
    const first = await request(app.getHttpServer())
      .post(`/api/exercises/${R1_SLUG}/hints/next`)
      .set('Cookie', cookies)
      .expect(200);
    expect(first.body.unlocked).toHaveLength(1);

    const second = await request(app.getHttpServer())
      .post(`/api/exercises/${R1_SLUG}/hints/next`)
      .set('Cookie', cookies)
      .expect(403);
    expect(JSON.stringify(second.body)).toContain(HINT_UPGRADE_MESSAGE);
  });

  it('hides retrieval fields from Free and shows them to Pro', async () => {
    const freeCookies = await signIn(
      app,
      `trace-free-${Date.now()}@labpath.test`,
    );
    const freeMe = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', freeCookies)
      .expect(200);
    const freeRunId = await seedR1Trace(prisma, freeMe.body.id as string);
    const freeTrace = await request(app.getHttpServer())
      .get(`/api/runs/${freeRunId}/trace`)
      .set('Cookie', freeCookies)
      .expect(200);
    expect(freeTrace.body.gated).toBe(true);
    expect(freeTrace.body.queries).toBeUndefined();
    expect(freeTrace.body.payload).toBeUndefined();
    expect(freeTrace.body.k).toBe(4);
    expect(JSON.stringify(freeTrace.body)).toMatch(/Pro/);

    const proCookies = await signIn(app, `trace-pro-${Date.now()}@labpath.test`);
    const proMe = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', proCookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: proMe.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });
    const proRunId = await seedR1Trace(prisma, proMe.body.id as string);
    const proTrace = await request(app.getHttpServer())
      .get(`/api/runs/${proRunId}/trace`)
      .set('Cookie', proCookies)
      .expect(200);
    expect(proTrace.body.gated).toBeUndefined();
    expect(proTrace.body.queries).toEqual([
      expect.objectContaining({
        question: 'what is rag',
        retrieved: [
          expect.objectContaining({
            chunkId: 'c1',
            text: 'retrieval hit',
          }),
        ],
      }),
    ]);
  });
});
