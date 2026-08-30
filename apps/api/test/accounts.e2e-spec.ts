import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  R1_REFERENCE_PAYLOAD,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

describe('Accounts & tier (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = `tier-${Date.now()}@labpath.test`;
  let cookies: string;
  let userId: string;

  beforeAll(async () => {
    app = await createApiApp();
    prisma = app.get(PrismaService);
    cookies = await signIn(app, email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('defaults every signed-in user to free with zero usage', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    userId = me.body.id as string;
    expect(me.body.account).toMatchObject({
      tier: 'free',
      subscriptionStatus: 'none',
      attemptsThisPeriod: 0,
      attemptsRemaining: 3,
      quotaExceeded: false,
      dailyRunCount: 0,
      limits: {
        attemptsPerPeriod: 3,
        periodKind: 'calendar_week',
      },
    });
  });

  it('increments quota counters on a graded submission', async () => {
    const started = await request(app.getHttpServer())
      .post('/api/attempts')
      .set('Cookie', cookies)
      .send({ exerciseSlug: R1_SLUG })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/attempts/${started.body.id}/submissions`)
      .set('Cookie', cookies)
      .send({ payload: R1_REFERENCE_PAYLOAD })
      .expect(201);

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(me.body.account.attemptsThisPeriod).toBe(1);
    expect(me.body.account.dailyRunCount).toBe(1);
    expect(me.body.account.lastAttemptAt).toEqual(expect.any(String));
  });

  it('hides the admin readout from learners', async () => {
    await request(app.getHttpServer())
      .get('/api/internal/accounts')
      .set('Cookie', cookies)
      .expect(403);
  });

  it('shows tier and usage on the admin readout', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' },
    });
    const list = await request(app.getHttpServer())
      .get('/api/internal/accounts')
      .set('Cookie', cookies)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(
      list.body.some(
        (row: { userId: string; tier: string }) =>
          row.userId === userId && row.tier === 'free',
      ),
    ).toBe(true);

    const one = await request(app.getHttpServer())
      .get(`/api/internal/accounts/${userId}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(one.body).toMatchObject({
      userId,
      email,
      tier: 'free',
      attemptsThisPeriod: 1,
      dailyRunCount: 1,
    });
  });
});
