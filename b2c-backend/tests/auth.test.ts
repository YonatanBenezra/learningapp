import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import express from 'express';
import request from 'supertest';
import { app } from '../src/app';
import { redis } from '../src/config/redis';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { upsertOAuthUser } from '../src/modules/auth/oauth.service';
import { authenticate, requireRole } from '../src/middlewares/auth.middleware';
import { errorMiddleware } from '../src/middlewares/error.middleware';
import { signAccessToken } from '../src/modules/auth/token.service';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_auth';
const creds = { email: 'user@example.com', password: 'supersecret1' };

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  await redis.connect();
});

afterEach(async () => {
  await User.deleteMany({});
  await RefreshToken.deleteMany({});
  const keys = await redis.keys('rl:*');
  if (keys.length) await redis.del(...keys);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  redis.disconnect();
});

describe('auth flow', () => {
  it('signs up, returns tokens, and never leaks passwordHash', async () => {
    const res = await request(app).post('/auth/signup').send(creds);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.email).toBe(creds.email);
    expect(res.body.user.id).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate signup with 409', async () => {
    await request(app).post('/auth/signup').send(creds);
    const res = await request(app).post('/auth/signup').send(creds);
    expect(res.status).toBe(409);
  });

  it('rejects a weak password with 400 (zod)', async () => {
    const res = await request(app).post('/auth/signup').send({ email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('rejects login with the wrong password', async () => {
    await request(app).post('/auth/signup').send(creds);
    const res = await request(app).post('/auth/login').send({ ...creds, password: 'wrongpass1' });
    expect(res.status).toBe(401);
  });

  it('logs in and accesses a protected route', async () => {
    await request(app).post('/auth/signup').send(creds);
    const login = await request(app).post('/auth/login').send(creds);
    expect(login.status).toBe(200);

    const me = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(creds.email);
  });

  it('rejects a protected route without a token', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).toBe(401);
  });

  it('updates preferences via PATCH /users/me', async () => {
    const signup = await request(app).post('/auth/signup').send(creds);
    const res = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${signup.body.accessToken}`)
      .send({ dailyNotification: true, timezone: 'Asia/Dhaka' });
    expect(res.status).toBe(200);
    expect(res.body.user.preferences.dailyNotification).toBe(true);
    expect(res.body.user.preferences.timezone).toBe('Asia/Dhaka');
  });
});

describe('refresh rotation + reuse detection', () => {
  it('rotates the refresh token', async () => {
    const signup = await request(app).post('/auth/signup').send(creds);
    const r1 = signup.body.refreshToken;
    const rotated = await request(app).post('/auth/refresh').send({ refreshToken: r1 });
    expect(rotated.status).toBe(200);
    expect(rotated.body.refreshToken).toBeTruthy();
    expect(rotated.body.refreshToken).not.toBe(r1);
  });

  it('detects reuse of a rotated token and revokes the whole family', async () => {
    const signup = await request(app).post('/auth/signup').send(creds);
    const r1 = signup.body.refreshToken;
    const rotated = await request(app).post('/auth/refresh').send({ refreshToken: r1 });
    const r2 = rotated.body.refreshToken;

    // Replaying r1 (already rotated) is detected.
    const reuse = await request(app).post('/auth/refresh').send({ refreshToken: r1 });
    expect(reuse.status).toBe(401);

    // Family revoked → even the freshly rotated r2 is now invalid.
    const afterRevoke = await request(app).post('/auth/refresh').send({ refreshToken: r2 });
    expect(afterRevoke.status).toBe(401);
  });

  it('invalidates refresh tokens on logout', async () => {
    const signup = await request(app).post('/auth/signup').send(creds);
    const r1 = signup.body.refreshToken;
    await request(app).post('/auth/logout').send({ refreshToken: r1 });
    const res = await request(app).post('/auth/refresh').send({ refreshToken: r1 });
    expect(res.status).toBe(401);
  });
});

describe('oauth upsert (create/link)', () => {
  it('creates a new user for an unknown OAuth identity', async () => {
    const user = await upsertOAuthUser({
      provider: 'google',
      providerId: 'g-new',
      email: 'oauth@example.com',
    });
    expect(user.email).toBe('oauth@example.com');
    expect(user.oauth?.providerId).toBe('g-new');
  });

  it('links an OAuth identity to an existing email account', async () => {
    const signup = await request(app).post('/auth/signup').send(creds);
    const existingId = signup.body.user.id;
    const linked = await upsertOAuthUser({
      provider: 'google',
      providerId: 'g-link',
      email: creds.email,
    });
    expect(String(linked._id)).toBe(existingId);
    expect(linked.oauth?.providerId).toBe('g-link');
  });
});

describe('requireRole guard', () => {
  // Minimal app exercising authenticate + requireRole (no admin route exists until Phase 12).
  const guarded = express();
  guarded.get('/admin-only', authenticate, requireRole('admin'), (_req, res) => res.json({ ok: true }));
  guarded.use(errorMiddleware);

  const token = (role: 'user' | 'admin') => signAccessToken({ sub: 'someid', role, tier: 'free' });

  it('401s without a token', async () => {
    const res = await request(guarded).get('/admin-only');
    expect(res.status).toBe(401);
  });

  it('403s for a non-admin user', async () => {
    const res = await request(guarded).get('/admin-only').set('Authorization', `Bearer ${token('user')}`);
    expect(res.status).toBe(403);
  });

  it('allows an admin through', async () => {
    const res = await request(guarded).get('/admin-only').set('Authorization', `Bearer ${token('admin')}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('rate limiting', () => {
  it('returns 429 once the credential-endpoint window max is exceeded', async () => {
    // Limiter is max 20 / window, keyed by IP. The 21st request should be blocked.
    let last = 0;
    for (let i = 0; i < 21; i++) {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever1' });
      last = res.status;
    }
    expect(last).toBe(429);
  });
});

describe('google oauth endpoint plumbing', () => {
  it('returns 501 when GOOGLE_CLIENT_ID is not configured', async () => {
    const res = await request(app).post('/auth/oauth/google').send({ idToken: 'dummy-token' });
    expect(res.status).toBe(501);
  });
});
