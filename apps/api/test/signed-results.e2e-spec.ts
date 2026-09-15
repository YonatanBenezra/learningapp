import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

describe('Signed assessment results (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes Ed25519 public keys', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/signing-keys')
      .expect(200);
    expect(response.body.algorithm).toBe('ed25519');
    expect(Object.keys(response.body.keys).length).toBeGreaterThan(0);
  });

  it('returns invalid for unknown result ids without leaking users', async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/api/assessments/results/00000000-0000-4000-8000-000000000000/verify',
      )
      .expect(200);
    expect(response.body.status).toBe('invalid');
    expect(response.body.result).toBeNull();
    expect(JSON.stringify(response.body)).not.toMatch(/userId|email/i);
  });

  it('returns invalid for malformed ids without auth', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/assessments/results/not-a-uuid/verify')
      .expect(200);
    expect(response.body.status).toBe('invalid');
    expect(response.body.result).toBeNull();
  });

  it('allows admin revocation without deleting history', async () => {
    const prisma = app.get(PrismaService);
    const keys = await request(app.getHttpServer())
      .get('/api/signing-keys')
      .expect(200);
    const keyIds = Object.keys(keys.body.keys as Record<string, string>);
    const row = await prisma.signedAssessmentResult.findFirst({
      where: { keyId: { in: keyIds }, revokedAt: null },
      orderBy: { issuedAt: 'desc' },
    });
    if (!row) {
      return;
    }

    const adminEmail = `signed-admin-${Date.now()}@labpath.test`;
    const cookies = await signIn(app, adminEmail);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    await prisma.user.update({
      where: { id: me.body.id as string },
      data: { role: 'admin' },
    });

    const revoked = await request(app.getHttpServer())
      .post(`/api/assessments/results/${row.id}/revoke`)
      .set('Cookie', cookies)
      .send({ reasonCode: 'manual_review' })
      .expect(201);

    expect(revoked.body.revokedAt).toBeTruthy();
    expect(revoked.body.revokeReasonCode).toBe('manual_review');
    expect(revoked.body.signatureValid).toBe(true);

    const verify = await request(app.getHttpServer())
      .get(`/api/assessments/results/${row.id}/verify`)
      .expect(200);
    expect(verify.body.status).toBe('revoked');
  });
});
