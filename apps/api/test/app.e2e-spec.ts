import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createApiApp } from './create-api-app';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createApiApp();
  });

  it('GET /api/health is liveness and does not require auth', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'labpath-api' });
  });

  it('GET /api/health/ready reports postgres and redis', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/health/ready',
    );

    expect([200, 503]).toContain(response.status);
    expect(response.body).toMatchObject({
      service: 'labpath-api',
      checks: {
        postgres: expect.stringMatching(/^(up|down)$/),
        redis: expect.stringMatching(/^(up|down)$/),
      },
    });
    if (response.status === 200) {
      expect(response.body.status).toBe('ok');
      expect(response.body.checks).toEqual({ postgres: 'up', redis: 'up' });
    } else {
      expect(response.body.status).toBe('unavailable');
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
