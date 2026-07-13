import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import express from 'express';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { Course } from '../src/modules/courses/course.model';
import { UsageQuota } from '../src/modules/subscriptions/usageQuota.model';
import { consumeQuota, getQuota, QuotaError } from '../src/modules/subscriptions/usageQuota.service';
import { userRateLimit } from '../src/middlewares/rateLimit.middleware';
import { usageQuota } from '../src/middlewares/usageQuota.middleware';
import { authenticate } from '../src/middlewares/auth.middleware';
import { errorMiddleware } from '../src/middlewares/error.middleware';
import { signAccessToken } from '../src/modules/auth/token.service';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_quota';
const uid = (): string => new mongoose.Types.ObjectId().toString();
const utcDay = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  // consumeQuota's race-safety relies on the unique (userId,period,periodStart)
  // index; build it before tests so the concurrency test is deterministic.
  await UsageQuota.init();
});

afterEach(async () => {
  await Promise.all([
    UsageQuota.deleteMany({}),
    User.deleteMany({}),
    RefreshToken.deleteMany({}),
    Course.deleteMany({}),
  ]);
  const keys = await redis.keys('rl:*');
  if (keys.length) await redis.del(...keys);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  redis.disconnect();
});

describe('consumeQuota', () => {
  it('allows up to the free daily limit then throws QuotaError', async () => {
    const userId = uid(); // free course limit = 3
    expect(await consumeQuota(userId, 'free', 'course')).toEqual({ limit: 3, used: 1 });
    await consumeQuota(userId, 'free', 'course');
    expect((await consumeQuota(userId, 'free', 'course')).used).toBe(3);
    await expect(consumeQuota(userId, 'free', 'course')).rejects.toBeInstanceOf(QuotaError);
  });

  it('resets on a new day (fresh periodStart)', async () => {
    const userId = uid();
    const day1 = new Date('2026-07-13T10:00:00Z');
    const day2 = new Date('2026-07-14T09:00:00Z');
    for (let i = 0; i < 3; i += 1) await consumeQuota(userId, 'free', 'course', day1);
    await expect(consumeQuota(userId, 'free', 'course', day1)).rejects.toBeInstanceOf(QuotaError);
    const next = await consumeQuota(userId, 'free', 'course', day2);
    expect(next.used).toBe(1);
  });

  it('gives premium users a higher limit', async () => {
    const userId = uid(); // premium course limit = 50
    for (let i = 0; i < 10; i += 1) await consumeQuota(userId, 'premium', 'course');
    expect((await consumeQuota(userId, 'premium', 'course')).used).toBe(11);
  });

  it('tracks each kind independently', async () => {
    const userId = uid();
    await consumeQuota(userId, 'free', 'quiz');
    await consumeQuota(userId, 'free', 'quiz');
    expect((await consumeQuota(userId, 'free', 'course')).used).toBe(1);
  });

  it('is race-safe under concurrent consumption (never exceeds the limit)', async () => {
    const userId = uid(); // free course limit = 3
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => consumeQuota(userId, 'free', 'course')),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(ok).toBe(3);
    expect(rejected).toHaveLength(5);
    expect(rejected.every((r) => (r as PromiseRejectedResult).reason instanceof QuotaError)).toBe(
      true,
    );
    // The persisted count must land exactly on the limit — no lost updates.
    expect((await getQuota(userId, 'free')).counts.courseGenerations).toBe(3);
  });
});

describe('getQuota', () => {
  it('returns zeroed counts + tier limits when nothing is used', async () => {
    const snap = await getQuota(uid(), 'free');
    expect(snap.period).toBe('daily');
    expect(snap.counts.courseGenerations).toBe(0);
    expect(snap.counts.quizGenerations).toBe(0);
    expect(snap.limits.courseGenerationsPerDay).toBe(3);
  });

  it('reflects usage after consumption', async () => {
    const userId = uid();
    await consumeQuota(userId, 'free', 'course');
    await consumeQuota(userId, 'free', 'quiz');
    await consumeQuota(userId, 'free', 'quiz');
    const snap = await getQuota(userId, 'free');
    expect(snap.counts.courseGenerations).toBe(1);
    expect(snap.counts.quizGenerations).toBe(2);
  });
});

describe('usageQuota middleware (HTTP 429)', () => {
  it('429s with quota headers when the daily limit is already reached', async () => {
    const s = await request(app)
      .post('/auth/signup')
      .send({ email: 'q@example.com', password: 'supersecret1' });
    const token = s.body.accessToken;
    const userId = s.body.user.id;
    const course = await Course.create({
      userId,
      title: 'C',
      category: 'X',
      topics: ['x'],
      level: 'beginner',
      status: 'ready',
      moduleOrder: [],
      progressPercent: 0,
    });

    // Seed today's usage at the free exam limit (5).
    await UsageQuota.create({
      userId,
      period: 'daily',
      periodStart: utcDay(new Date()),
      counts: {
        courseGenerations: 0,
        exerciseGenerations: 0,
        quizGenerations: 0,
        examGenerations: 5,
        labExecutions: 0,
      },
    });

    const res = await request(app)
      .post(`/courses/${course._id}/exam`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(429);
    expect(res.body.kind).toBe('exam');
    expect(res.body.limit).toBe(5);
    expect(res.headers['x-quota-limit']).toBe('5');
    expect(res.headers['x-quota-remaining']).toBe('0');
  });
});

describe('usageQuota middleware (success path)', () => {
  it('consumes quota, sets headers, and decrements remaining across requests', async () => {
    const qApp = express();
    qApp.get('/g', authenticate, usageQuota('quiz'), (_req, res) => res.json({ ok: true }));
    qApp.use(errorMiddleware);

    const token = signAccessToken({ sub: uid(), role: 'user', tier: 'free' }); // quiz free = 20
    const auth = { Authorization: `Bearer ${token}` };

    const r1 = await request(qApp).get('/g').set(auth);
    const r2 = await request(qApp).get('/g').set(auth);

    expect(r1.status).toBe(200);
    expect(r1.headers['x-quota-limit']).toBe('20');
    expect(r1.headers['x-quota-remaining']).toBe('19');
    expect(r2.headers['x-quota-remaining']).toBe('18');
  });
});

describe('userRateLimit', () => {
  it('sets rate-limit headers and 429s once the tier max is exceeded', async () => {
    const rlApp = express();
    rlApp.get(
      '/x',
      authenticate,
      userRateLimit({ windowMs: 60_000, free: 2, premium: 5, keyPrefix: 'rltest' }),
      (_req, res) => res.json({ ok: true }),
    );
    rlApp.use(errorMiddleware);

    const token = signAccessToken({ sub: 'ratelimit-user', role: 'user', tier: 'free' });
    const auth = { Authorization: `Bearer ${token}` };

    const r1 = await request(rlApp).get('/x').set(auth);
    const r2 = await request(rlApp).get('/x').set(auth);
    const r3 = await request(rlApp).get('/x').set(auth);

    expect(r1.status).toBe(200);
    expect(r1.headers['x-ratelimit-limit']).toBe('2');
    expect(r1.headers['x-ratelimit-remaining']).toBe('1');
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
  });

  it('applies the higher premium max for premium users', async () => {
    const rlApp = express();
    rlApp.get(
      '/x',
      authenticate,
      userRateLimit({ windowMs: 60_000, free: 2, premium: 5, keyPrefix: 'rlprem' }),
      (_req, res) => res.json({ ok: true }),
    );
    rlApp.use(errorMiddleware);

    const token = signAccessToken({ sub: 'premium-user', role: 'user', tier: 'premium' });
    const r = await request(rlApp).get('/x').set({ Authorization: `Bearer ${token}` });

    expect(r.status).toBe(200);
    expect(r.headers['x-ratelimit-limit']).toBe('5');
    expect(r.headers['x-ratelimit-remaining']).toBe('4');
  });
});
