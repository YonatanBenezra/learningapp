import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { DOGFOOD_CONTEST } from '../src/modules/contests/contests.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

describe('Contests (e2e)', () => {
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
    await request(app.getHttpServer()).get('/api/contests').expect(401);
  });

  it('blocks Free users from entering with upgrade message', async () => {
    const cookies = await signIn(app, `contest-free-${Date.now()}@labpath.test`);
    const response = await request(app.getHttpServer())
      .post(`/api/contests/${DOGFOOD_CONTEST}/enter`)
      .set('Cookie', cookies)
      .expect(403);
    expect(response.body.message.code).toBe('pro_required');
    expect(response.body.message.upgradePath).toBe('/billing');
  });

  it('lets Pro users enter, records sample_seed, and hides pool items', async () => {
    const cookies = await signIn(app, `contest-pro-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });

    const entered = await request(app.getHttpServer())
      .post(`/api/contests/${DOGFOOD_CONTEST}/enter`)
      .set('Cookie', cookies)
      .expect(201);
    expect(entered.body.sampleSeed).toEqual(expect.any(String));
    expect(entered.body.sampledCount).toBe(2);
    expect(entered.body.problems).toHaveLength(2);
    expect(entered.body.entered).toBe(true);

    const serialized = JSON.stringify(entered.body);
    expect(serialized).not.toContain('eval_hidden');
    expect(serialized).not.toContain('HIDDEN_EVAL');
    expect(serialized).not.toContain('CTST_001_CANARY');
    expect(serialized).not.toContain('CTST_002_CANARY');
    expect(serialized).not.toContain('CTST_003_CANARY');
    expect(serialized).not.toContain('CTST_004_CANARY');

    const detail = await request(app.getHttpServer())
      .get(`/api/contests/${DOGFOOD_CONTEST}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(detail.body.sampleSeed).toBe(entered.body.sampleSeed);
  });

  it('serves contest exercises only after entry', async () => {
    const cookies = await signIn(app, `contest-ex-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });
    await request(app.getHttpServer())
      .get('/api/contests/dogfood-s1/exercises/ctst-001-priority-prompt')
      .set('Cookie', cookies)
      .expect(403);

    const entered = await request(app.getHttpServer())
      .post('/api/contests/dogfood-s1/enter')
      .set('Cookie', cookies)
      .expect(201);
    const slug = entered.body.problems[0].slug as string;
    const exercise = await request(app.getHttpServer())
      .get(`/api/contests/dogfood-s1/exercises/${slug}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(exercise.body.hintsDisabled).toBe(true);
    expect(exercise.body.contestSlug).toBe(DOGFOOD_CONTEST);
    expect(JSON.stringify(exercise.body)).not.toContain('eval_hidden');
  });

  it('switches the leaderboard to contest scores after the window closes', async () => {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { slug: DOGFOOD_CONTEST },
    });
    const past = new Date('2026-08-01T00:00:00.000Z');
    await prisma.contest.update({
      where: { id: contest.id },
      data: { endsAt: past },
    });

    const board = await request(app.getHttpServer())
      .get('/api/leaderboard')
      .expect(200);
    expect(board.body.rule).toContain('Contest score');

    await prisma.contest.update({
      where: { id: contest.id },
      data: { endsAt: new Date('2026-12-31T23:59:59.000Z') },
    });
  });
});
