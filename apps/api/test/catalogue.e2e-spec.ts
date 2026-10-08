import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { loadPublishedSlugs } from '../src/content/content-paths';
import {
  CATALOGUE_LIVE,
  HIDDEN_EVAL_CANARY,
  POC_CATALOGUE_TARGET,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { describeLiveCatalogue } from './describe-live-catalogue';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

describe('Catalogue (e2e)', () => {
  let app: INestApplication<App>;
  let cookies: string;

  beforeAll(async () => {
    app = await createApiApp();
    cookies = await signIn(app, `catalogue-${Date.now()}@labpath.test`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without a cookie', async () => {
    await request(app.getHttpServer()).get('/api/exercises').expect(401);
  });

  (CATALOGUE_LIVE ? it.skip : it)(
    'lists an empty catalogue when nothing is published',
    async () => {
      const response = await request(app.getHttpServer())
        .get('/api/exercises?pageSize=200')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.total).toBe(POC_CATALOGUE_TARGET);
      expect(response.body.items).toEqual([]);
      expect(JSON.stringify(response.body)).not.toContain(HIDDEN_EVAL_CANARY);
    },
  );

  describeLiveCatalogue('with published exercises', () => {
    it('lists published exercises for an authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/exercises?pageSize=200')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.total).toBe(POC_CATALOGUE_TARGET);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(JSON.stringify(response.body)).not.toContain(HIDDEN_EVAL_CANARY);
    });

    it('lists the curated catalogue without hidden eval text', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/exercises?pageSize=200')
        .set('Cookie', cookies)
        .expect(200);

      const published = loadPublishedSlugs();
      const items = response.body.items as Array<{
        slug: string;
        simulator: string;
      }>;
      expect(response.body.total).toBe(POC_CATALOGUE_TARGET);
      expect(items).toHaveLength(POC_CATALOGUE_TARGET);
      expect(items.map((item) => item.slug).sort()).toEqual(
        [...published].sort(),
      );

      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain(HIDDEN_EVAL_CANARY);
      expect(serialized).not.toContain('HIDDEN_EVAL');
      expect(serialized).not.toContain('eval_hidden');

      for (const item of response.body.items as { slug: string }[]) {
        const detail = await request(app.getHttpServer())
          .get(`/api/exercises/${item.slug}`)
          .set('Cookie', cookies)
          .expect(200);
        const body = JSON.stringify(detail.body);
        expect(detail.body.hiddenEval).toBeUndefined();
        expect(body).not.toContain('HIDDEN_EVAL');
        expect(body).not.toContain('eval_hidden');
      }
    }, 30_000);

    it('returns the public brief and sample without hidden eval items', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/exercises/${R1_SLUG}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.slug).toBe(R1_SLUG);
      expect(response.body.hiddenEval).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(HIDDEN_EVAL_CANARY);
      expect(JSON.stringify(response.body)).not.toContain('eval_hidden');
    });
  });

  it('hides unpublished filler exercises from the catalogue', async () => {
    await request(app.getHttpServer())
      .get('/api/exercises/rag-005-sentence-split')
      .set('Cookie', cookies)
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/exercises/grd-005-encoding-trick')
      .set('Cookie', cookies)
      .expect(404);
  });
});
