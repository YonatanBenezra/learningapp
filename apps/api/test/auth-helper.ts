import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

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
