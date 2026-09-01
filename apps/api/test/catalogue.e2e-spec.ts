import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  E1_SLUG,
  E2_SLUG,
  E3_SLUG,
  G1_SLUG,
  G2_SLUG,
  G3_SLUG,
  HIDDEN_EVAL_CANARY,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
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

  it('lists published R1 for an authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/exercises?pageSize=200')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(10);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: R1_SLUG,
          title: 'Chunk It Right',
          simulator: 'rag',
          difficulty: 'E',
          skillTags: expect.arrayContaining(['chunking', 'retrieval-quality']),
        }),
        expect.objectContaining({
          slug: 'rag-002-the-cost-ceiling',
          title: 'The Cost Ceiling',
        }),
        expect.objectContaining({
          slug: 'rag-003-the-citation-contract',
          title: 'The Citation Contract',
        }),
        expect.objectContaining({
          slug: 'rag-004-rerank-or-rethink',
          title: 'Rerank or Re-think',
        }),
        expect.objectContaining({
          slug: E1_SLUG,
          title: 'Write the Assertion Suite',
          simulator: 'evaluation',
        }),
        expect.objectContaining({
          slug: E2_SLUG,
          title: 'Judge the Judge',
        }),
        expect.objectContaining({
          slug: E3_SLUG,
          title: 'Catch the Regression',
        }),
        expect.objectContaining({
          slug: G1_SLUG,
          title: 'Break the Concierge',
          simulator: 'guardrails',
        }),
        expect.objectContaining({
          slug: G2_SLUG,
          title: 'The Indirect Payload',
        }),
        expect.objectContaining({
          slug: G3_SLUG,
          title: 'Hold the Line',
        }),
      ]),
    );
    expect(JSON.stringify(response.body)).not.toContain(HIDDEN_EVAL_CANARY);
  });

  it('lists 50 published exercises without hidden eval text', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/exercises?pageSize=200')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(50);
    expect(response.body.items.length).toBeGreaterThanOrEqual(50);
    const simulators = response.body.items.map(
      (item: { simulator: string }) => item.simulator,
    );
    const ragPrompt = simulators.filter(
      (value: string) => value === 'rag' || value === 'prompt_engineering',
    ).length;
    const evalCount = simulators.filter(
      (value: string) => value === 'evaluation',
    ).length;
    const guardCount = simulators.filter(
      (value: string) => value === 'guardrails',
    ).length;
    expect(ragPrompt).toBeGreaterThanOrEqual(20);
    expect(evalCount).toBeGreaterThanOrEqual(15);
    expect(guardCount).toBeGreaterThanOrEqual(15);
    expect(simulators).toEqual(
      expect.arrayContaining(['agent', 'benchmark']),
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
  });

  it('returns the public brief and sample without hidden eval items', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/exercises/${R1_SLUG}`)
      .set('Cookie', cookies)
      .expect(200);

    expect(response.body).toMatchObject({
      slug: R1_SLUG,
      title: 'Chunk It Right',
      briefMd: expect.stringContaining('Fix the chunking'),
    });
    expect(response.body.publicSample).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'p1' })]),
    );
    expect(response.body.hiddenEval).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain(HIDDEN_EVAL_CANARY);
    expect(JSON.stringify(response.body)).not.toContain('eval_hidden');
  });
});
