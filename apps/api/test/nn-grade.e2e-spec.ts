import { execSync } from 'node:child_process';
import path from 'node:path';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  N1_NEAR_MISS_PAYLOAD,
  N1_REFERENCE_PAYLOAD,
  N1_SLUG,
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

describe('Neural network grading (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: true });
    execSync(`node scripts/content/ingest-local.mjs ${N1_SLUG}`, {
      cwd: path.join(process.cwd()),
      stdio: 'pipe',
    });
    const prisma = app.get(PrismaService);
    await prisma.exercise.update({
      where: { slug_version: { slug: N1_SLUG, version: 1 } },
      data: { isPublished: true },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('grades N1 reference and near-miss without leaking hidden eval', async () => {
    const cookies = await signInPro(
      app,
      `nn-grade-${Date.now()}@labpath.test`,
    );

    const pass = await submit(app, cookies, N1_SLUG, {
      ...N1_REFERENCE_PAYLOAD,
    });
    expect(pass.grade.verdict).toBe('pass');
    expect(JSON.stringify(pass.grade)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(pass.trace)).not.toContain('HIDDEN_EVAL');

    const miss = await submit(app, cookies, N1_SLUG, {
      ...N1_NEAR_MISS_PAYLOAD,
    });
    expect(miss.grade.verdict).toBe('fail');
    expect(miss.grade.failureClasses).toContain('wrong-diagnosis');
    expect(JSON.stringify(miss.grade)).not.toContain('HIDDEN_EVAL');
  });
});
