import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  R1_REFERENCE_PAYLOAD,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

const validPayload = R1_REFERENCE_PAYLOAD;

async function waitForRun(
  app: INestApplication<App>,
  cookies: string,
  runId: string,
  status: string,
) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
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
      setTimeout(resolve, 100);
    });
  }
  throw new Error(`run ${runId} did not reach ${status}`);
}

describe('Practice loop (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp();
    cookies = await signIn(app, `practice-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without a cookie', async () => {
    await request(app.getHttpServer())
      .post('/api/attempts')
      .send({ exerciseSlug: R1_SLUG })
      .expect(401);
  });

  it('starts R1, rejects a bad payload, and grades a valid run', async () => {
    const started = await request(app.getHttpServer())
      .post('/api/attempts')
      .set('Cookie', cookies)
      .send({ exerciseSlug: R1_SLUG })
      .expect(201);

    expect(started.body).toMatchObject({
      exerciseSlug: R1_SLUG,
      status: 'started',
    });

    await request(app.getHttpServer())
      .post(`/api/attempts/${started.body.id}/submissions`)
      .set('Cookie', cookies)
      .send({ payload: { chunkSize: 10 } })
      .expect(400);

    const submitted = await request(app.getHttpServer())
      .post(`/api/attempts/${started.body.id}/submissions`)
      .set('Cookie', cookies)
      .send({ payload: validPayload })
      .expect(201);

    expect(submitted.body).toMatchObject({
      status: 'queued',
      runId: expect.any(String),
      submissionId: expect.any(String),
    });

    const run = await waitForRun(
      app,
      cookies,
      submitted.body.runId as string,
      'succeeded',
    );

    expect(run).toMatchObject({
      id: submitted.body.runId,
      status: 'succeeded',
    });

    const grade = await request(app.getHttpServer())
      .get(`/api/runs/${submitted.body.runId}/grade`)
      .set('Cookie', cookies)
      .expect(200);

    expect(grade.body.verdict).toBe('pass');
    expect(JSON.stringify(grade.body)).not.toContain(
      'HIDDEN_EVAL_R1_CANARY_PHRASE',
    );
  });

  it('returns 404 for an unknown exercise slug', async () => {
    await request(app.getHttpServer())
      .post('/api/attempts')
      .set('Cookie', cookies)
      .send({ exerciseSlug: 'does-not-exist' })
      .expect(404);
  });
});
