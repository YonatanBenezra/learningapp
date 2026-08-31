import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { HIDDEN_EVAL_CANARY } from '../src/modules/catalogue/exercises/exercises.constants';
import { HISTORY_LIMIT } from '../src/modules/progress/progress.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';
import { seedPass } from './seed-pass';

describe('Engagement (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without a cookie', async () => {
    await request(app.getHttpServer()).get('/api/me/progress').expect(401);
  });

  it('surfaces today’s drill as a published Easy exercise', async () => {
    const cookies = await signIn(app, `drill-${Date.now()}@labpath.test`);
    const progress = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);

    expect(progress.body.dailyDrill).toEqual(
      expect.objectContaining({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        slug: expect.any(String),
        title: expect.any(String),
        difficulty: 'E',
        completed: false,
      }),
    );
    expect(progress.body.streak).toEqual({
      current: 0,
      longest: 0,
      timezone: 'UTC',
      today: progress.body.dailyDrill.date,
      lastQualifiedDate: null,
    });
    expect(progress.body.items).toEqual([]);
    expect(JSON.stringify(progress.body)).not.toContain(HIDDEN_EVAL_CANARY);

    const exercise = await request(app.getHttpServer())
      .get(`/api/exercises/${progress.body.dailyDrill.slug}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(exercise.body.slug).toBe(progress.body.dailyDrill.slug);
    expect(exercise.body.isPublished ?? true).toBe(true);
    expect(JSON.stringify(exercise.body)).not.toContain(HIDDEN_EVAL_CANARY);
  });

  it('returns the same drill on repeat requests the same day', async () => {
    const cookies = await signIn(app, `rotate-${Date.now()}@labpath.test`);
    const first = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    const second = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    expect(second.body.dailyDrill.slug).toBe(first.body.dailyDrill.slug);
    expect(second.body.dailyDrill.date).toBe(first.body.dailyDrill.date);
  });

  it('increments streak on a pass today and marks the drill complete', async () => {
    const cookies = await signIn(app, `streak-inc-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const before = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    const slug = before.body.dailyDrill.slug as string;
    const now = new Date();
    const todayStart = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    await seedPass(
      prisma,
      me.body.id as string,
      slug,
      new Date(todayStart - 12 * 60 * 60 * 1000),
    );
    await seedPass(prisma, me.body.id as string, slug, now);

    const after = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    expect(after.body.streak.current).toBe(2);
    expect(after.body.streak.longest).toBe(2);
    expect(after.body.dailyDrill.completed).toBe(true);
    expect(after.body.solves).toBe(1);
    expect(after.body.items[0]).toEqual(
      expect.objectContaining({
        exerciseSlug: slug,
        verdict: 'pass',
      }),
    );
    expect(after.body.items[0].attemptId).toEqual(expect.any(String));
  });

  it('does not increment streak or complete the drill on a fail', async () => {
    const cookies = await signIn(app, `streak-fail-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const before = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    await seedPass(
      prisma,
      me.body.id as string,
      before.body.dailyDrill.slug as string,
      new Date(),
      'fail',
    );
    const after = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    expect(after.body.streak.current).toBe(0);
    expect(after.body.dailyDrill.completed).toBe(false);
    expect(after.body.items[0].verdict).toBe('fail');
  });

  it('resets the streak when a calendar day is missed', async () => {
    const cookies = await signIn(app, `streak-reset-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const drill = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    const now = new Date();
    const todayStart = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    await seedPass(
      prisma,
      me.body.id as string,
      drill.body.dailyDrill.slug as string,
      new Date(todayStart - 3 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000),
    );

    const after = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    expect(after.body.streak.current).toBe(0);
    expect(after.body.streak.longest).toBe(1);
    expect(after.body.streak.lastQualifiedDate).toEqual(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it('accepts an IANA timezone and falls back to UTC when invalid', async () => {
    const cookies = await signIn(app, `streak-tz-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const drill = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=America/New_York')
      .set('Cookie', cookies)
      .expect(200);
    expect(drill.body.streak.timezone).toBe('America/New_York');
    await seedPass(
      prisma,
      me.body.id as string,
      drill.body.dailyDrill.slug as string,
      new Date(Date.now() - 20 * 60 * 60 * 1000),
    );

    const after = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=America/New_York')
      .set('Cookie', cookies)
      .expect(200);
    expect(after.body.streak.current).toBeGreaterThanOrEqual(1);

    const fallback = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=not-a-zone')
      .set('Cookie', cookies)
      .expect(200);
    expect(fallback.body.streak.timezone).toBe('UTC');
  });

  it('caps solve history at the last N attempts', async () => {
    const cookies = await signIn(app, `history-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const drill = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    const slug = drill.body.dailyDrill.slug as string;
    const extra = 3;
    const total = HISTORY_LIMIT + extra;
    const userId = me.body.id as string;
    for (let start = 0; start < total; start += 10) {
      const chunk = Array.from(
        { length: Math.min(10, total - start) },
        (_, offset) => {
          const i = start + offset;
          return seedPass(
            prisma,
            userId,
            slug,
            new Date(Date.now() - i * 1000),
            i % 2 === 0 ? 'pass' : 'fail',
          );
        },
      );
      await Promise.all(chunk);
    }

    const after = await request(app.getHttpServer())
      .get('/api/me/progress?timezone=UTC')
      .set('Cookie', cookies)
      .expect(200);
    expect(after.body.items).toHaveLength(HISTORY_LIMIT);
    expect(after.body.attempts).toBe(total);
    expect(after.body.items[0].verdict).toMatch(/pass|fail/);
    expect(after.body.items[0].exerciseSlug).toBe(slug);
  }, 30_000);
});
