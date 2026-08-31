import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  HIDDEN_EVAL_CANARY,
  R1_NEAR_MISS_PAYLOAD,
  R1_REFERENCE_PAYLOAD,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signInPro } from './auth-helper';
import { createApiApp } from './create-api-app';

async function waitForRun(
  app: INestApplication<App>,
  cookies: string,
  runId: string,
  status: string,
) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const response = await request(app.getHttpServer())
      .get(`/api/runs/${runId}`)
      .set('Cookie', cookies)
      .expect(200);
    if (response.body.status === status) {
      return response.body as { id: string; status: string };
    }
    if (response.body.status === 'failed') {
      throw new Error(`run ${runId} failed`);
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
  throw new Error(`run ${runId} did not reach ${status}`);
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
  await waitForRun(app, cookies, submitted.body.runId as string, 'succeeded');
  const grade = await request(app.getHttpServer())
    .get(`/api/runs/${submitted.body.runId}/grade`)
    .set('Cookie', cookies)
    .expect(200);
  return grade.body as { verdict: string };
}

describe('R1 grade (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp();
    cookies = await signInPro(app, `r1-grade-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('passes the reference config and fails the near-miss', async () => {
    const passed = await submit(app, cookies, R1_REFERENCE_PAYLOAD);
    expect(passed.verdict).toBe('pass');
    expect(JSON.stringify(passed)).not.toContain(HIDDEN_EVAL_CANARY);

    const missed = await submit(app, cookies, R1_NEAR_MISS_PAYLOAD);
    expect(missed.verdict).toBe('fail');
    expect(JSON.stringify(missed)).not.toContain(HIDDEN_EVAL_CANARY);
  });

  it('re-grades the same payload to the same verdict', async () => {
    const first = await submit(app, cookies, R1_REFERENCE_PAYLOAD);
    const second = await submit(app, cookies, R1_REFERENCE_PAYLOAD);
    expect(second.verdict).toBe(first.verdict);
  });
});
