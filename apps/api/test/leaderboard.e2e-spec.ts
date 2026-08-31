import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  HIDDEN_EVAL_CANARY,
  R1_SLUG,
  R2_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { LEADERBOARD_RULE } from '../src/modules/leaderboard/leaderboard-rank';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';
import { seedPass } from './seed-pass';

describe('Leaderboard (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('is public and lists only published Pro profiles without PII or canaries', async () => {
    const stamp = Date.now();
    const hiddenEmail = `lb-hidden-${stamp}@labpath.test`;
    const hiddenCookies = await signIn(app, hiddenEmail);
    const hiddenMe = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', hiddenCookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: hiddenMe.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });
    await seedPass(prisma, hiddenMe.body.id as string, R1_SLUG, new Date());
    await seedPass(prisma, hiddenMe.body.id as string, R2_SLUG, new Date());
    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', hiddenCookies)
      .send({ displayName: 'Hidden', slug: `lb-hidden-${stamp}`, enabled: false })
      .expect(200);

    const empty = await request(app.getHttpServer()).get('/api/leaderboard').expect(200);
    expect(empty.body.rule).toBe(LEADERBOARD_RULE);
    expect(Array.isArray(empty.body.items)).toBe(true);
    expect(
      (empty.body.items as { slug: string }[]).some(
        (row) => row.slug === `lb-hidden-${stamp}`,
      ),
    ).toBe(false);
    expect(JSON.stringify(empty.body)).not.toContain(hiddenEmail);
    expect(JSON.stringify(empty.body)).not.toContain(hiddenMe.body.id);

    const shownEmail = `lb-shown-${stamp}@labpath.test`;
    const shownCookies = await signIn(app, shownEmail);
    const shownMe = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', shownCookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: shownMe.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });
    await seedPass(prisma, shownMe.body.id as string, R1_SLUG, new Date());
    const slug = `lb-shown-${stamp}`;
    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', shownCookies)
      .send({ displayName: 'Shown', slug, enabled: true })
      .expect(200);

    const listed = await request(app.getHttpServer()).get('/api/leaderboard').expect(200);
    const row = (listed.body.items as Array<{
      slug: string;
      displayName: string;
      solves: number;
      rating: number;
    }>).find((item) => item.slug === slug);
    expect(row).toEqual(
      expect.objectContaining({
        slug,
        displayName: 'Shown',
        solves: 1,
        recentPasses: 1,
        rating: 101,
      }),
    );
    expect(row).not.toHaveProperty('id');
    expect(row).not.toHaveProperty('email');
    const serialized = JSON.stringify(listed.body);
    expect(serialized).not.toContain(shownEmail);
    expect(serialized).not.toContain(shownMe.body.id);
    expect(serialized).not.toContain(HIDDEN_EVAL_CANARY);
    expect(serialized).not.toContain('HIDDEN_EVAL');
    expect(serialized).not.toContain('eval_hidden');

    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', shownCookies)
      .send({ enabled: false })
      .expect(200);
    const afterOptOut = await request(app.getHttpServer())
      .get('/api/leaderboard')
      .expect(200);
    expect(
      (afterOptOut.body.items as { slug: string }[]).some(
        (item) => item.slug === slug,
      ),
    ).toBe(false);
  });
});
