import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ContestKind } from '@prisma/client';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { currentAssessmentSeasonKey } from '../src/modules/assessments/assessment-season';
import { DOGFOOD_CONTEST } from '../src/modules/contests/contests.constants';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

const ASSESSMENT_SLUG = 'test-assessment-engine';

describe('Assessments (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
    prisma = app.get(PrismaService);

    const pool = [
      'ctst-001-priority-prompt',
      'ctst-002-ticket-format',
      'ctst-003-category-map',
      'ctst-004-urgency-parse',
    ];
    const seasonKey = currentAssessmentSeasonKey(new Date());
    await prisma.contest.upsert({
      where: { slug: ASSESSMENT_SLUG },
      create: {
        slug: ASSESSMENT_SLUG,
        title: 'Assessment engine fixture',
        intent: 'E2E only — VA1 content lands in Step 5.',
        kind: ContestKind.assessment,
        seasonKey,
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
        endsAt: new Date('2027-12-31T23:59:59.000Z'),
        timeBoxMinutes: 90,
        sampleSize: 4,
        isPublished: true,
        problems: {
          create: pool.map((exerciseSlug, index) => ({
            position: index + 1,
            exerciseSlug,
          })),
        },
      },
      update: {
        kind: ContestKind.assessment,
        seasonKey,
        timeBoxMinutes: 90,
        sampleSize: 4,
        problems: {
          deleteMany: {},
          create: pool.map((exerciseSlug, index) => ({
            position: index + 1,
            exerciseSlug,
          })),
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists assessments separately from contests', async () => {
    const cookies = await signIn(app, `assessment-list-${Date.now()}@labpath.test`);
    const contests = await request(app.getHttpServer())
      .get('/api/contests')
      .set('Cookie', cookies)
      .expect(200);
    const assessments = await request(app.getHttpServer())
      .get('/api/assessments')
      .set('Cookie', cookies)
      .expect(200);
    expect(contests.body.items.some((item: { slug: string }) => item.slug === DOGFOOD_CONTEST)).toBe(
      true,
    );
    expect(
      assessments.body.items.some((item: { slug: string }) => item.slug === ASSESSMENT_SLUG),
    ).toBe(true);
    expect(
      contests.body.items.some((item: { slug: string }) => item.slug === ASSESSMENT_SLUG),
    ).toBe(false);
  });

  it('blocks Free users from entering with upgrade message', async () => {
    const cookies = await signIn(app, `assessment-free-${Date.now()}@labpath.test`);
    const response = await request(app.getHttpServer())
      .post(`/api/assessments/${ASSESSMENT_SLUG}/enter`)
      .set('Cookie', cookies)
      .expect(403);
    expect(response.body.message.code).toBe('pro_required');
  });

  it('samples four problems and refuses a second sitting in the same season', async () => {
    const cookies = await signIn(app, `assessment-pro-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    await prisma.account.update({
      where: { userId: me.body.id as string },
      data: { tier: 'pro', subscriptionStatus: 'active' },
    });

    const entered = await request(app.getHttpServer())
      .post(`/api/assessments/${ASSESSMENT_SLUG}/enter`)
      .set('Cookie', cookies)
      .expect(201);
    expect(entered.body.sampledCount).toBe(4);
    expect(entered.body.problems).toHaveLength(4);

    const second = await request(app.getHttpServer())
      .post(`/api/assessments/${ASSESSMENT_SLUG}/enter`)
      .set('Cookie', cookies)
      .expect(201);
    expect(second.body.entered).toBe(true);

    const seasonKey = currentAssessmentSeasonKey(new Date());
    const otherSlug = `${ASSESSMENT_SLUG}-b`;
    await prisma.contest.upsert({
      where: { slug: otherSlug },
      create: {
        slug: otherSlug,
        title: 'Second assessment same season',
        intent: 'Season gate test',
        kind: ContestKind.assessment,
        seasonKey,
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
        endsAt: new Date('2027-12-31T23:59:59.000Z'),
        timeBoxMinutes: 90,
        sampleSize: 4,
        isPublished: true,
        problems: {
          create: ['ctst-001-priority-prompt', 'ctst-002-ticket-format', 'ctst-003-category-map', 'ctst-004-urgency-parse'].map(
            (exerciseSlug, index) => ({
              position: index + 1,
              exerciseSlug,
            }),
          ),
        },
      },
      update: { seasonKey },
    });

    const blocked = await request(app.getHttpServer())
      .post(`/api/assessments/${otherSlug}/enter`)
      .set('Cookie', cookies)
      .expect(400);
    expect(blocked.body.message.code).toBe('assessment_season_used');
  });
});
