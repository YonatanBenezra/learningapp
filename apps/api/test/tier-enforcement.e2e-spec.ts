import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  R1_REFERENCE_PAYLOAD,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { product } from '../src/config/product.constants';
import { describeLiveCatalogue } from './describe-live-catalogue';
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

describeLiveCatalogue('Tier enforcement (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApiApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not quota-block practice while unlimitedPractice is enabled', async () => {
    expect(product.unlimitedPractice).toBe(true);
    const cookies = await signIn(app, `quota-free-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: {
        attemptsThisPeriod: 60,
        periodStartedAt: new Date(),
      },
    });

    await submitR1(app, cookies, R1_REFERENCE_PAYLOAD, 201);
  });

  it('lets Free users unlock every hint while unlimitedHints is enabled', async () => {
    expect(product.unlimitedHints).toBe(true);
    const cookies = await signIn(app, `hint-free-${Date.now()}@labpath.test`);
    const first = await request(app.getHttpServer())
      .post(`/api/exercises/${R1_SLUG}/hints/next`)
      .set('Cookie', cookies)
      .expect(200);
    expect(first.body.unlocked).toHaveLength(1);

    const second = await request(app.getHttpServer())
      .post(`/api/exercises/${R1_SLUG}/hints/next`)
      .set('Cookie', cookies)
      .expect(200);
    expect(second.body.unlocked.length).toBeGreaterThan(1);
  });

  it('shows full traces to Free users while fullTracesForAll is enabled', async () => {
    expect(product.fullTracesForAll).toBe(true);
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
    expect(freeTrace.body.gated).toBeUndefined();
    expect(freeTrace.body.queries).toEqual([
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
