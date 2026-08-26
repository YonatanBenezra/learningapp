import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  HIDDEN_EVAL_CANARY,
  R1_NEAR_MISS_PAYLOAD,
  R1_REFERENCE_PAYLOAD,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

async function waitForRun(
  app: INestApplication<App>,
  cookies: string,
  runId: string,
) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const response = await request(app.getHttpServer())
      .get(`/api/runs/${runId}`)
      .set('Cookie', cookies)
      .expect(200);
    if (response.body.status === 'succeeded') {
      return response.body as { id: string };
    }
    if (response.body.status === 'failed') {
      throw new Error(`run ${runId} failed`);
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
  throw new Error(`run ${runId} did not succeed`);
}

async function submit(
  app: INestApplication<App>,
  cookies: string,
  payload: Record<string, unknown>,
) {
  const started = await request(app.getHttpServer())
    .post('/api/attempts')
    .set('Cookie', cookies)
    .send({ exerciseSlug: R1_SLUG })
    .expect(201);
  const submitted = await request(app.getHttpServer())
    .post(`/api/attempts/${started.body.id}/submissions`)
    .set('Cookie', cookies)
    .send({ payload })
    .expect(201);
  return waitForRun(app, cookies, submitted.body.runId as string);
}

describe('R1 screens (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp();
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

    let remaining = first.body.remaining as number;
    while (remaining > 0) {
      const next = await request(app.getHttpServer())
        .post(`/api/exercises/${R1_SLUG}/hints/next`)
        .set('Cookie', cookies)
        .expect(200);
      remaining = next.body.remaining as number;
    }

    await request(app.getHttpServer())
      .post(`/api/exercises/${R1_SLUG}/hints/next`)
      .set('Cookie', cookies)
      .expect(400);
  });

  it('writes a redacted trace and progress after a grade', async () => {
    const passed = await submit(app, cookies, R1_REFERENCE_PAYLOAD);
    const missed = await submit(app, cookies, R1_NEAR_MISS_PAYLOAD);

    const trace = await request(app.getHttpServer())
      .get(`/api/runs/${missed.id}/trace`)
      .set('Cookie', cookies)
      .expect(200);
    const serialized = JSON.stringify(trace.body);
    expect(serialized).not.toContain(HIDDEN_EVAL_CANARY);
    expect(serialized).not.toContain('goldSpan');
    expect(serialized).not.toContain('goldAnswer');
    expect(trace.body.queries.length).toBeGreaterThan(0);
    expect(trace.body.queries[0].retrieved[0]).toEqual(
      expect.objectContaining({
        chunkId: expect.any(String),
        score: expect.any(Number),
        text: expect.any(String),
      }),
    );

    const passTrace = await request(app.getHttpServer())
      .get(`/api/runs/${passed.id}/trace`)
      .set('Cookie', cookies)
      .expect(200);
    expect(JSON.stringify(passTrace.body)).not.toContain(HIDDEN_EVAL_CANARY);

    const progress = await request(app.getHttpServer())
      .get('/api/me/progress')
      .set('Cookie', cookies)
      .expect(200);
    expect(progress.body.attempts).toBeGreaterThanOrEqual(2);
    expect(progress.body.solves).toBeGreaterThanOrEqual(1);
    expect(progress.body.skills.length).toBeGreaterThan(0);
    expect(JSON.stringify(progress.body)).not.toContain(HIDDEN_EVAL_CANARY);
  });
});
