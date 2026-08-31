import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  HIDDEN_EVAL_CANARY,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';
import { seedPass } from './seed-pass';

describe('Public profile (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets anyone read a published Pro profile without auth', async () => {
    const email = `pub-${Date.now()}@labpath.test`;
    const cookies = await signIn(app, email);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(me.body.profile).toMatchObject({
      slug: null,
      public: false,
      canPublish: false,
      published: false,
      urlPath: null,
    });

    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });
    await seedPass(prisma, me.body.id as string, R1_SLUG, new Date());
    const skill = await prisma.skill.findFirst({ where: { slug: 'chunking' } });
    if (skill) {
      await prisma.userSkillScore.upsert({
        where: {
          userId_skillId: {
            userId: me.body.id as string,
            skillId: skill.id,
          },
        },
        create: {
          userId: me.body.id as string,
          skillId: skill.id,
          score: 0.8,
        },
        update: { score: 0.8 },
      });
    }

    const published = await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', cookies)
      .send({
        displayName: 'Ada',
        slug: `ada-${Date.now()}`,
        enabled: true,
      })
      .expect(200);
    expect(published.body.published).toBe(true);
    expect(published.body.urlPath).toBe(`/u/${published.body.slug}`);

    const profile = await request(app.getHttpServer())
      .get(`/api/profiles/${published.body.slug}`)
      .expect(200);
    expect(profile.body).toMatchObject({
      slug: published.body.slug,
      displayName: 'Ada',
      solves: 1,
      rating: 101,
    });
    expect(profile.body.recent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: R1_SLUG,
          title: expect.any(String),
          passedAt: expect.any(String),
        }),
      ]),
    );
    const serialized = JSON.stringify(profile.body);
    expect(serialized).not.toContain(email);
    expect(serialized).not.toContain(me.body.id);
    expect(serialized).not.toContain(HIDDEN_EVAL_CANARY);
    expect(serialized).not.toContain('goldSpan');
    expect(serialized).not.toContain('goldAnswer');
    expect(serialized).not.toContain('HIDDEN_EVAL');
  });

  it('404s when the profile is private, Free, or unknown', async () => {
    const cookies = await signIn(app, `priv-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });
    const slug = `hidden-${Date.now()}`;
    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', cookies)
      .send({ slug, enabled: true })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', cookies)
      .send({ enabled: false })
      .expect(200);
    await request(app.getHttpServer()).get(`/api/profiles/${slug}`).expect(404);

    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: { tier: 'free', subscriptionStatus: 'none' },
    });
    await prisma.user.update({
      where: { id: me.body.id as string },
      data: { profilePublic: true },
    });
    await request(app.getHttpServer()).get(`/api/profiles/${slug}`).expect(404);
    await request(app.getHttpServer()).get('/api/profiles/no-such-user').expect(404);
  });

  it('blocks Free users from publishing and rejects taken slugs', async () => {
    const first = await signIn(app, `slug-a-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', first)
      .expect(200);
    const slug = `taken-${Date.now()}`;
    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', first)
      .send({ slug, enabled: true })
      .expect(403);

    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });
    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', first)
      .send({ slug, enabled: true })
      .expect(200);

    const secondCookies = await signIn(
      app,
      `slug-b-${Date.now()}@labpath.test`,
    );
    const second = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', secondCookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: second.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });
    await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set('Cookie', secondCookies)
      .send({ slug, enabled: true })
      .expect(409);
  });
});
