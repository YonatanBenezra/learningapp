import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  R2_NEAR_MISS_PAYLOAD,
  R2_REFERENCE_PAYLOAD,
  R2_SLUG,
  R3_NEAR_MISS_PAYLOAD,
  R3_REFERENCE_PAYLOAD,
  R3_SLUG,
  R4_NEAR_MISS_PAYLOAD,
  R4_REFERENCE_PAYLOAD,
  R4_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signInPro } from './auth-helper';
import { createApiApp } from './create-api-app';

jest.setTimeout(120000);

async function waitForRun(
  app: INestApplication<App>,
  cookies: string,
  runId: string,
  status: string,
) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
      setTimeout(resolve, 200);
    });
  }
  throw new Error(`run ${runId} did not reach ${status}`);
}

async function submit(
  app: INestApplication<App>,
  cookies: string,
  slug: string,
  payload: Record<string, unknown>,
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
    .expect(201);
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
  };
}

describe('RAG R2–R4 grade (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp();
    cookies = await signInPro(app, `rag-grade-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['R2', R2_SLUG, R2_REFERENCE_PAYLOAD, R2_NEAR_MISS_PAYLOAD],
    ['R3', R3_SLUG, R3_REFERENCE_PAYLOAD, R3_NEAR_MISS_PAYLOAD],
    ['R4', R4_SLUG, R4_REFERENCE_PAYLOAD, R4_NEAR_MISS_PAYLOAD],
  ] as const)(
    '%s reference passes and near-miss fails without leaking hidden eval',
    async (_label, slug, reference, nearMiss) => {
      const passed = await submit(app, cookies, slug, reference);
      expect(passed.grade.verdict).toBe('pass');
      expect(JSON.stringify(passed.grade)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(passed.trace)).not.toContain('HIDDEN_EVAL');

      const missed = await submit(app, cookies, slug, nearMiss);
      expect(missed.grade.verdict).toBe('fail');
      expect(JSON.stringify(missed.grade)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(missed.trace)).not.toContain('HIDDEN_EVAL');
    },
  );
});
