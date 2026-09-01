import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  A1_NEAR_MISS_PAYLOAD,
  A1_REFERENCE_PAYLOAD,
  A1_SLUG,
  A2_NEAR_MISS_PAYLOAD,
  A2_REFERENCE_PAYLOAD,
  A2_SLUG,
  A3_NEAR_MISS_PAYLOAD,
  A3_REFERENCE_PAYLOAD,
  A3_SLUG,
  A4_NEAR_MISS_PAYLOAD,
  A4_REFERENCE_PAYLOAD,
  A4_SLUG,
  A5_NEAR_MISS_PAYLOAD,
  A5_REFERENCE_PAYLOAD,
  A5_SLUG,
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
  for (let attempt = 0; attempt < 120; attempt += 1) {
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
    if (response.body.status === 'killed_budget') {
      return response.body as {
        id: string;
        status: string;
        errorMessage?: string;
      };
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

describe('A1/A2 agent grade (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp();
    cookies = await signInPro(app, `agent-grade-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists A1–A5 in the catalogue under agent', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/exercises?pageSize=200')
      .set('Cookie', cookies)
      .expect(200);
    const items = response.body.items as Array<{
      slug: string;
      simulator: string;
    }>;
    for (const slug of [A1_SLUG, A2_SLUG, A3_SLUG, A4_SLUG, A5_SLUG]) {
      const row = items.find((item) => item.slug === slug);
      expect(row).toBeDefined();
      expect(row?.simulator).toBe('agent');
    }
  });

  it('A1 reference passes with a step trace; near-miss fails without leaking hidden eval', async () => {
    const passed = await submit(app, cookies, A1_SLUG, A1_REFERENCE_PAYLOAD);
    expect(passed.grade.verdict).toBe('pass');
    const steps = passed.trace.steps as Array<{ name: string; argsSummary: string }> | undefined;
    expect(steps?.some((step) => step.name === 'calculator')).toBe(true);
    expect(steps?.some((step) => step.argsSummary.length > 0)).toBe(true);
    expect(JSON.stringify(passed.grade)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(passed.trace)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(passed.trace)).not.toContain('eval_hidden');

    const missed = await submit(app, cookies, A1_SLUG, A1_NEAR_MISS_PAYLOAD);
    expect(missed.grade.verdict).toBe('fail');
    expect(JSON.stringify(missed.grade)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(missed.trace)).not.toContain('HIDDEN_EVAL');
  });

  it('A2 reference recovers; near-miss tight loop fails without leaking hidden eval', async () => {
    const passed = await submit(app, cookies, A2_SLUG, A2_REFERENCE_PAYLOAD);
    expect(passed.grade.verdict).toBe('pass');
    expect(JSON.stringify(passed.grade)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(passed.trace)).not.toContain('HIDDEN_EVAL');

    const missed = await submit(app, cookies, A2_SLUG, A2_NEAR_MISS_PAYLOAD);
    expect(missed.grade.verdict).toBe('fail');
    expect(missed.grade.failureClasses).toContain('no-recovery');
    expect(JSON.stringify(missed.grade)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(missed.trace)).not.toContain('HIDDEN_EVAL');
  });

  it('A3–A5 reference pass and near-miss fail without leaking hidden eval', async () => {
    const cases = [
      {
        slug: A3_SLUG,
        pass: A3_REFERENCE_PAYLOAD,
        miss: A3_NEAR_MISS_PAYLOAD,
        failClass: 'wrong-order',
      },
      {
        slug: A4_SLUG,
        pass: A4_REFERENCE_PAYLOAD,
        miss: A4_NEAR_MISS_PAYLOAD,
        failClass: 'call-budget',
      },
      {
        slug: A5_SLUG,
        pass: A5_REFERENCE_PAYLOAD,
        miss: A5_NEAR_MISS_PAYLOAD,
        failClass: 'call-budget',
      },
    ];
    for (const row of cases) {
      const passed = await submit(app, cookies, row.slug, row.pass);
      expect(passed.grade.verdict).toBe('pass');
      expect(JSON.stringify(passed.grade)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(passed.trace)).not.toContain('HIDDEN_EVAL');

      const missed = await submit(app, cookies, row.slug, row.miss);
      expect(missed.grade.verdict).toBe('fail');
      expect(missed.grade.failureClasses).toContain(row.failClass);
      expect(JSON.stringify(missed.grade)).not.toContain('HIDDEN_EVAL');
      expect(JSON.stringify(missed.trace)).not.toContain('HIDDEN_EVAL');
    }
  });
});
