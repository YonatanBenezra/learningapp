import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  HIDDEN_EVAL_CANARY,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';
import { seedR1Trace } from './seed-trace';

describe('R1 screens (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
    prisma = app.get(PrismaService);
    cookies = await signIn(app, `r1-screens-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without a cookie', async () => {
    await request(app.getHttpServer()).get('/api/me/progress').expect(401);
    await request(app.getHttpServer())
      .get(`/api/exercises/${R1_SLUG}/hints`)
      .expect(401);
  });

  it('unlocks progressive hints', async () => {
    const empty = await request(app.getHttpServer())
      .get(`/api/exercises/${R1_SLUG}/hints`)
      .set('Cookie', cookies)
      .expect(200);
    expect(empty.body.unlocked).toEqual([]);
    expect(empty.body.remaining).toBeGreaterThan(0);

    const first = await request(app.getHttpServer())
      .post(`/api/exercises/${R1_SLUG}/hints/next`)
      .set('Cookie', cookies)
      .expect(200);
    expect(first.body.unlocked).toHaveLength(1);
    expect(first.body.unlocked[0].text).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post(`/api/exercises/${R1_SLUG}/hints/next`)
      .set('Cookie', cookies)
      .expect(403);
  });

  it('gates the Free-tier trace and never leaks hidden eval text', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const runId = await seedR1Trace(prisma, me.body.id as string, {
      goldSpan: 'should-not-leak',
      queries: [
        {
          source: 'hidden',
          question: HIDDEN_EVAL_CANARY,
          retrieved: [{ chunkId: 'c', docId: 'd', score: 1, text: 'goldAnswer' }],
        },
      ],
    });

    const trace = await request(app.getHttpServer())
      .get(`/api/runs/${runId}/trace`)
      .set('Cookie', cookies)
      .expect(200);
    const serialized = JSON.stringify(trace.body);
    expect(serialized).not.toContain(HIDDEN_EVAL_CANARY);
    expect(serialized).not.toContain('goldSpan');
    expect(serialized).not.toContain('goldAnswer');
    expect(trace.body.gated).toBe(true);
    expect(trace.body.queries).toBeUndefined();

    const progress = await request(app.getHttpServer())
      .get('/api/me/progress')
      .set('Cookie', cookies)
      .expect(200);
    expect(progress.body.skills).toEqual(expect.any(Array));
    expect(JSON.stringify(progress.body)).not.toContain(HIDDEN_EVAL_CANARY);
  });
});
