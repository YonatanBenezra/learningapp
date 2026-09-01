import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  B1_NEAR_MISS_PAYLOAD,
  B1_REFERENCE_PAYLOAD,
  B1_SLUG,
  B2_NEAR_MISS_PAYLOAD,
  B2_REFERENCE_PAYLOAD,
  B2_SLUG,
  B3_NEAR_MISS_PAYLOAD,
  B3_REFERENCE_PAYLOAD,
  B3_SLUG,
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
    grade: grade.body as {
      verdict: string;
      failureClasses?: string[];
      scorecard?: Record<string, unknown>;
    },
    trace: trace.body as Record<string, unknown>,
  };
}

describe('B1–B3 benchmark grade (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp();
    cookies = await signInPro(app, `bench-grade-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists B1–B3 in the catalogue under benchmark', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/exercises?pageSize=200')
      .set('Cookie', cookies)
      .expect(200);
    const items = response.body.items as Array<{
      slug: string;
      simulator: string;
    }>;
    for (const slug of [B1_SLUG, B2_SLUG, B3_SLUG]) {
      const row = items.find((item) => item.slug === slug);
      expect(row).toBeDefined();
      expect(row?.simulator).toBe('benchmark');
    }
  });

  it.each([
    ['B1', B1_SLUG, B1_REFERENCE_PAYLOAD, B1_NEAR_MISS_PAYLOAD],
    ['B2', B2_SLUG, B2_REFERENCE_PAYLOAD, B2_NEAR_MISS_PAYLOAD],
    ['B3', B3_SLUG, B3_REFERENCE_PAYLOAD, B3_NEAR_MISS_PAYLOAD],
  ] as const)(
    '%s reference passes; near-miss treats the headline as a ranking win; no hidden eval leak',
    async (_label, slug, reference, nearMiss) => {
      const passed = await submit(app, cookies, slug, { ...reference });
      expect(passed.grade.verdict).toBe('pass');
      expect(passed.grade.scorecard?.wallClock).toBe('information');
      expect(passed.grade.scorecard?.ciA).toEqual(
        expect.objectContaining({ low: expect.any(Number), high: expect.any(Number) }),
      );
      expect(JSON.stringify(passed.grade)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(passed.trace)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(passed.trace)).not.toContain('eval_hidden');

      const missed = await submit(app, cookies, slug, { ...nearMiss });
      expect(missed.grade.verdict).toBe('fail');
      expect(missed.grade.failureClasses).toEqual(
        expect.arrayContaining(['ranking-win', 'wrong-cause']),
      );
      expect(JSON.stringify(missed.grade)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(missed.trace)).not.toContain('HIDDEN_EVAL');
    },
  );
});
