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

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signs in with a magic link and hits /api/me', async () => {
    const requested = await request(app.getHttpServer())
      .post('/api/auth/magic-link')
      .send({ email })
      .expect(201);

    expect(requested.body.ok).toBe(true);
    expect(requested.body.token).toEqual(expect.any(String));

    const consumed = await request(app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token: requested.body.token })
      .expect(201);

    expect(consumed.body.user.email).toBe(email);
    const cookies = cookieHeader(consumed.headers['set-cookie']);
    expect(cookies).toContain('lp_access=');
    expect(cookies).toContain('lp_refresh=');

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(me.body).toMatchObject({
      id: consumed.body.user.id,
      email,
      role: 'learner',
      account: { tier: 'free', subscriptionStatus: 'none' },
    });
  });

  it('returns 401 on guarded routes without a cookie', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
    await request(app.getHttpServer()).get('/api/exercises').expect(401);
  });

  it('rotates refresh cookies and logout clears the session', async () => {
    const requested = await request(app.getHttpServer())
      .post('/api/auth/magic-link')
      .send({ email: `refresh-${Date.now()}@labpath.test` })
      .expect(201);

    const consumed = await request(app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token: requested.body.token })
      .expect(201);

    const cookies = cookieHeader(consumed.headers['set-cookie']);
    const refreshed = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(201);

    const nextCookies = cookieHeader(refreshed.headers['set-cookie']);
    expect(nextCookies).toContain('lp_access=');

    await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', nextCookies)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', nextCookies)
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', nextCookies)
      .expect(401);

    await request(app.getHttpServer()).get('/api/me').expect(401);
  });
});
