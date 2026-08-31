import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  GUARDRAILS_RED_TEAM_PATH,
  GUARDRAILS_RED_TEAM_STEPS,
  RAG_FUNDAMENTALS_PATH,
  RAG_FUNDAMENTALS_STEPS,
} from '../src/modules/catalogue/paths/paths.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';
import { seedPass } from './seed-pass';

describe('Guided paths (e2e)', () => {
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
    await request(app.getHttpServer()).get('/api/paths').expect(401);
  });

  it('lists seeded paths and jumps to the next unsolved step', async () => {
    const cookies = await signIn(app, `paths-${Date.now()}@labpath.test`);
    const listed = await request(app.getHttpServer())
      .get('/api/paths')
      .set('Cookie', cookies)
      .expect(200);

    const slugs = (listed.body.items as { slug: string }[]).map((item) => item.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([RAG_FUNDAMENTALS_PATH, GUARDRAILS_RED_TEAM_PATH]),
    );
    expect(JSON.stringify(listed.body)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(listed.body)).not.toContain('eval_hidden');

    const rag = listed.body.items.find(
      (item: { slug: string }) => item.slug === RAG_FUNDAMENTALS_PATH,
    );
    expect(rag.nextSlug).toBe(RAG_FUNDAMENTALS_STEPS[0]);
    expect(rag.complete).toBe(false);
    expect(rag.passedCount).toBe(0);

    const detail = await request(app.getHttpServer())
      .get(`/api/paths/${RAG_FUNDAMENTALS_PATH}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(detail.body.nextSlug).toBe(RAG_FUNDAMENTALS_STEPS[0]);
    expect(detail.body.steps).toHaveLength(RAG_FUNDAMENTALS_STEPS.length);
    expect(detail.body.steps[0]).toEqual(
      expect.objectContaining({
        slug: RAG_FUNDAMENTALS_STEPS[0],
        passed: false,
        title: expect.any(String),
      }),
    );
    expect(detail.body).not.toHaveProperty('briefMd');
    expect(detail.body).not.toHaveProperty('publicSample');
    expect(JSON.stringify(detail.body)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(detail.body)).not.toContain('eval_hidden');
  });

  it('marks a path complete after the last step passes', async () => {
    const cookies = await signIn(app, `paths-done-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    const now = new Date();
    for (const slug of GUARDRAILS_RED_TEAM_STEPS) {
      await seedPass(prisma, me.body.id as string, slug, now);
    }

    const detail = await request(app.getHttpServer())
      .get(`/api/paths/${GUARDRAILS_RED_TEAM_PATH}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(detail.body.complete).toBe(true);
    expect(detail.body.nextSlug).toBeNull();
    expect(detail.body.passedCount).toBe(GUARDRAILS_RED_TEAM_STEPS.length);
    expect(detail.body.steps.every((step: { passed: boolean }) => step.passed)).toBe(
      true,
    );
    expect(JSON.stringify(detail.body)).not.toContain('HIDDEN_EVAL');
  });
});
