import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

describe('Onboarding (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not assign a first-session onboarding exercise', async () => {
    const cookies = await signIn(app, `onboard-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(me.body.onboarding).toMatchObject({
      needed: false,
      exerciseSlug: '',
      starter: {},
    });
  });

  it('still accepts onboarding analytics events', async () => {
    const cookies = await signIn(app, `onboard-event-${Date.now()}@labpath.test`);
    await request(app.getHttpServer())
      .post('/api/me/events')
      .set('Cookie', cookies)
      .send({ name: 'first_submit' })
      .expect(201);
  });
});
