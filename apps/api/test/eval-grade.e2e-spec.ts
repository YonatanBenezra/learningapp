import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  E1_NEAR_MISS_PAYLOAD,
  E1_REFERENCE_PAYLOAD,
  E1_SLUG,
  E2_NEAR_MISS_PAYLOAD,
  E2_REFERENCE_PAYLOAD,
  E2_SLUG,
  E3_NEAR_MISS_PAYLOAD,
  E3_REFERENCE_PAYLOAD,
  E3_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signInPro } from './auth-helper';
import { createApiApp } from './create-api-app';

jest.setTimeout(180000);

async function waitForRun(
  app: INestApplication<App>,
  cookies: string,
  runId: string,
  status: string,
) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const response = await request(app.getHttpServer())
      .get(`/api/runs/${runId}`)
      .set('Cookie', cookies)
      .expect(200);
    if (response.body.status === status) {
      return response.body as { id: string; status: string };
    }
    if (response.body.status === 'failed') {
      throw new Error(
        `run ${runId} failed: ${response.body.errorMessage ?? ''}`,
      );
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }
  throw new Error(`run ${runId} did not reach ${status}`);
}

async function submit(
  app: INestApplication<App>,
  cookies: string,
  slug: string,
  payload: Record<string, unknown>,
  expectedStatus = 201,
) {
  const started = await request(app.getHttpServer())
    .post('/api/attempts')
    .set('Cookie', cookies)
    .send({ exerciseSlug: slug })
    .expect(201);
  const submitted = await request(app.getHttpServer())
    .post(`/api/attempts/${started.body.id}/submissions`)
    .set('Cookie', cookies)
    .send({ payload })
    .expect(expectedStatus);
  if (expectedStatus !== 201) {
    return { grade: null, trace: null, status: submitted.status };
  }
  await waitForRun(app, cookies, submitted.body.runId as string, 'succeeded');
  const grade = await request(app.getHttpServer())
    .get(`/api/runs/${submitted.body.runId}/grade`)
    .set('Cookie', cookies)
    .expect(200);
  const trace = await request(app.getHttpServer())
    .get(`/api/runs/${submitted.body.runId}/trace`)
    .set('Cookie', cookies)
    .expect(200);
  return {
    grade: grade.body as { verdict: string },
    trace: trace.body as Record<string, unknown>,
    status: submitted.status,
  };
}

describe('Eval E1–E3 grade (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp();
    cookies = await signInPro(app, `eval-grade-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['E1', E1_SLUG, E1_REFERENCE_PAYLOAD, E1_NEAR_MISS_PAYLOAD],
    ['E2', E2_SLUG, E2_REFERENCE_PAYLOAD, E2_NEAR_MISS_PAYLOAD],
    ['E3', E3_SLUG, E3_REFERENCE_PAYLOAD, E3_NEAR_MISS_PAYLOAD],
  ] as const)(
    '%s reference passes and near-miss fails without leaking hidden eval',
    async (_label, slug, reference, nearMiss) => {
      const passed = await submit(app, cookies, slug, reference);
      expect(passed.grade?.verdict).toBe('pass');
      expect(JSON.stringify(passed.grade)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(passed.trace)).not.toContain('HIDDEN_EVAL');

      const missed = await submit(app, cookies, slug, nearMiss);
      expect(missed.grade?.verdict).toBe('fail');
      expect(JSON.stringify(missed.grade)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(missed.trace)).not.toContain('HIDDEN_EVAL');
    },
  );

  it('rejects a sixth E3 submission within the cooldown window', async () => {
    const policyCookies = await signInPro(
      app,
      `eval-e3-policy-${Date.now()}@labpath.test`,
    );
    const started = await request(app.getHttpServer())
      .post('/api/attempts')
      .set('Cookie', policyCookies)
      .send({ exerciseSlug: E3_SLUG })
      .expect(201);
    for (let i = 0; i < 5; i += 1) {
      const submitted = await request(app.getHttpServer())
        .post(`/api/attempts/${started.body.id}/submissions`)
        .set('Cookie', policyCookies)
        .send({ payload: E3_NEAR_MISS_PAYLOAD })
        .expect(201);
      await waitForRun(
        app,
        policyCookies,
        submitted.body.runId as string,
        'succeeded',
      );
    }
    await request(app.getHttpServer())
      .post(`/api/attempts/${started.body.id}/submissions`)
      .set('Cookie', policyCookies)
      .send({ payload: E3_NEAR_MISS_PAYLOAD })
      .expect(429);
  });
});
