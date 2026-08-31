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
): Promise<string> {
  const requested = await request(app.getHttpServer())
    .post('/api/auth/magic-link')
    .send({ email })
    .expect(201);
  const consumed = await request(app.getHttpServer())
    .post('/api/auth/magic-link/consume')
    .send({ token: requested.body.token })
    .expect(201);
  return cookieHeader(consumed.headers['set-cookie']);
}

/** Grade suites submit more than the Free weekly cap of 3. */
export async function signInPro(
  app: INestApplication,
  email: string,
): Promise<string> {
  const cookies = await signIn(app, email);
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
