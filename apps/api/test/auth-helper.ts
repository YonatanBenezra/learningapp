import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/core/prisma/prisma.service';

export function cookieHeader(setCookie: string | string[] | undefined): string {
  const parts = !setCookie
    ? []
    : Array.isArray(setCookie)
      ? setCookie
      : [setCookie];
  return parts.map((entry) => entry.split(';')[0]).join('; ');
}

export async function signIn(
  app: INestApplication,
  email: string,
  password = 'test-password-123',
): Promise<string> {
  const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 20) || 'user';
  const registered = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ username: `${username}${Date.now()}`, email, password })
    .expect(201);

  if (registered.headers['set-cookie']) {
    return cookieHeader(registered.headers['set-cookie']);
  }

  const loggedIn = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ login: email, password })
    .expect(201);

  return cookieHeader(loggedIn.headers['set-cookie']);
}

/** Grade suites submit more than the Free weekly cap of 3. */
export async function signInPro(
  app: INestApplication,
  email: string,
  password = 'test-password-123',
): Promise<string> {
  const cookies = await signIn(app, email, password);
  const me = await request(app.getHttpServer())
    .get('/api/me')
    .set('Cookie', cookies)
    .expect(200);
  await app.get(PrismaService).account.update({
    where: { userId: me.body.id as string },
    data: { tier: 'pro', subscriptionStatus: 'active' },
  });
  return cookies;
}
