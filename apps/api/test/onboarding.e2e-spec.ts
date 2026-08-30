import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  HIDDEN_EVAL_CANARY,
  R1_SLUG,
} from '../src/modules/catalogue/exercises/exercises.constants';
import { ONBOARDING_STARTER } from '../src/modules/identity/users/onboarding';
import { signIn } from './auth-helper';
import { createApiApp } from './create-api-app';

describe('Onboarding (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApiApp({ withWorker: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('sends a new user to the R1 starter without hidden eval text', async () => {
    const cookies = await signIn(app, `onboard-${Date.now()}@labpath.test`);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(me.body.onboarding).toMatchObject({
      needed: true,
      exerciseSlug: R1_SLUG,
      starter: ONBOARDING_STARTER,
      timeToFirstSubmitMs: null,
      timeToFirstPassMs: null,
    });
    const serialized = JSON.stringify(me.body.onboarding);
    expect(serialized).not.toContain(HIDDEN_EVAL_CANARY);
    expect(serialized).not.toContain('HIDDEN_EVAL');
    expect(serialized).not.toContain('goldSpan');
    expect(serialized).not.toContain('goldAnswer');

    const exercise = await request(app.getHttpServer())
      .get(`/api/exercises/${me.body.onboarding.exerciseSlug}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(JSON.stringify(exercise.body)).not.toContain(HIDDEN_EVAL_CANARY);
  });

  it('records time-to-first-submit from signup and clears the first-session flag', async () => {
    const cookies = await signIn(app, `onboard-event-${Date.now()}@labpath.test`);
    const tracked = await request(app.getHttpServer())
      .post('/api/me/events')
      .set('Cookie', cookies)
      .send({ name: 'first_submit' })
      .expect(201);
    expect(tracked.body.name).toBe('first_submit');
    expect(tracked.body.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(tracked.body.elapsedMs).toBeLessThan(3 * 60 * 1000);

    const started = await request(app.getHttpServer())
      .post('/api/attempts')
      .set('Cookie', cookies)
      .send({ exerciseSlug: R1_SLUG })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/attempts/${started.body.id}/submissions`)
      .set('Cookie', cookies)
      .send({ payload: ONBOARDING_STARTER })
      .expect(201);

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(me.body.onboarding.needed).toBe(false);
    expect(me.body.onboarding.timeToFirstSubmitMs).toEqual(expect.any(Number));
    expect(me.body.onboarding.timeToFirstSubmitMs).toBeLessThan(3 * 60 * 1000);
  });
});
