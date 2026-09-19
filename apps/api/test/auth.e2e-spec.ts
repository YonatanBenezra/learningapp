import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createApiApp } from './create-api-app';

function cookieHeader(setCookie: string | string[] | undefined): string {
  const parts = !setCookie
    ? []
    : Array.isArray(setCookie)
      ? setCookie
      : [setCookie];
  return parts.map((entry) => entry.split(';')[0]).join('; ');
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const email = `poc-${Date.now()}@labpath.test`;
  const username = `user${Date.now()}`;
  const password = 'secure-pass-123';

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, signs in with password, and hits /api/me', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, email, password })
      .expect(201);

    expect(registered.body.user.email).toBe(email);
    const cookies = cookieHeader(registered.headers['set-cookie']);
    expect(cookies).toContain('lp_access=');
    expect(cookies).toContain('lp_refresh=');

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(me.body).toMatchObject({
      id: registered.body.user.id,
      email,
      role: 'learner',
      account: { tier: 'free', subscriptionStatus: 'none' },
      onboarding: { needed: true, exerciseSlug: 'rag-001-chunk-it-right' },
    });

    const loggedIn = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: email, password })
      .expect(201);

    expect(loggedIn.body.user.email).toBe(email);
  });

  it('returns 401 on guarded routes without a cookie', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
    await request(app.getHttpServer()).get('/api/exercises').expect(401);
  });

  it('rotates refresh cookies and logout clears the session', async () => {
    const refreshEmail = `refresh-${Date.now()}@labpath.test`;
    const registered = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: `refresh${Date.now()}`,
        email: refreshEmail,
        password,
      })
      .expect(201);

    const cookies = cookieHeader(registered.headers['set-cookie']);
    const refreshed = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(201);

    expect(refreshed.body.user.email).toBe(refreshEmail);
    const nextCookies = cookieHeader(refreshed.headers['set-cookie']);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', nextCookies)
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', nextCookies)
      .expect(401);
  });
});
