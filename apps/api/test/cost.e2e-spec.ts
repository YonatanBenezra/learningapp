import request from 'supertest';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

describe('Cost + budget (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
    cookies = await signIn(app, `cost-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without a cookie', async () => {
    await request(app.getHttpServer()).get('/api/internal/cost').expect(401);
    await request(app.getHttpServer())
      .post('/api/internal/cost/over-budget')
      .expect(401);
  });

  it('kills a fake over-budget gateway call and reports it', async () => {
    const killed = await request(app.getHttpServer())
      .post('/api/internal/cost/over-budget')
      .set('Cookie', cookies)
      .expect(201);

    expect(killed.body).toMatchObject({
      status: 'killed_budget',
      errorCode: 'budget_exceeded',
    });
    expect(killed.body.errorMessage).toEqual(expect.any(String));

    const run = await request(app.getHttpServer())
      .get(`/api/runs/${killed.body.id}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(run.body.status).toBe('killed_budget');
    expect(run.body.errorCode).toBe('budget_exceeded');
    expect(run.body.errorMessage).toBeTruthy();

    const summary = await request(app.getHttpServer())
      .get('/api/internal/cost')
      .set('Cookie', cookies)
      .expect(200);
    expect(summary.body.killedBudget).toBeGreaterThanOrEqual(1);
    expect(summary.body.model).toBe('labpath-fake-v1');
  });
});
