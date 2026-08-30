import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import type { Env } from '../src/core/config/env.schema';
import { StripeGateway, stripeSignatureHeader } from '../src/modules/billing/stripe.gateway';
import { signIn } from './auth-helper';

const WEBHOOK_SECRET = 'whsec_test_billing';

describe('Billing (e2e)', () => {
  let app: INestApplication<App>;
  const email = `billing-${Date.now()}@labpath.test`;
  const stripeCustomer = `cus_billing_${Date.now()}`;
  const stripeSubscription = `sub_billing_${Date.now()}`;
  let cookies: string;
  let userId: string;

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_billing';
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.STRIPE_PRICE_MONTHLY = 'price_monthly';
    process.env.STRIPE_PRICE_ANNUAL = 'price_annual';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StripeGateway)
      .useFactory({
        factory: () => {
          const config = {
            get: (key: string) => {
              const values: Record<string, string> = {
                STRIPE_SECRET_KEY: 'sk_test_billing',
                STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
                STRIPE_PRICE_MONTHLY: 'price_monthly',
                STRIPE_PRICE_ANNUAL: 'price_annual',
                PUBLIC_WEB_URL: 'http://localhost:3000',
              };
              return values[key] ?? '';
            },
          } as ConfigService<Env, true>;
          const real = new StripeGateway(config);
          real.createCheckoutSession = async () => ({
            url: 'https://checkout.stripe.test/session',
          });
          real.createPortalSession = async () => ({
            url: 'https://billing.stripe.test/portal',
          });
          return real;
        },
      })
      .compile();
    app = moduleFixture.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
    cookies = await signIn(app, email);
    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    userId = me.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a test checkout session for Pro monthly', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/billing/checkout')
      .set('Cookie', cookies)
      .send({ interval: 'monthly' })
      .expect(201);
    expect(res.body.url).toBe('https://checkout.stripe.test/session');
  });

  it('rejects webhooks without a signature', async () => {
    await request(app.getHttpServer())
      .post('/api/billing/webhook')
      .send({ id: 'evt_x' })
      .expect(401);
  });

  it('rejects webhooks with a bad signature', async () => {
    await request(app.getHttpServer())
      .post('/api/billing/webhook')
      .set('Stripe-Signature', 't=1,v1=nope')
      .send({ id: 'evt_x', type: 'ping', data: { object: {} } })
      .expect(401);
  });

  it('upgrades the user to Pro from a signed subscription webhook', async () => {
    const payload = JSON.stringify({
      id: 'evt_up',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: stripeSubscription,
          customer: stripeCustomer,
          status: 'active',
          metadata: { userId },
        },
      },
    });
    await request(app.getHttpServer())
      .post('/api/billing/webhook')
      .set('Stripe-Signature', stripeSignatureHeader(payload, WEBHOOK_SECRET))
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(201);

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(me.body.account).toMatchObject({
      tier: 'pro',
      subscriptionStatus: 'active',
      limits: {
        attemptsPerPeriod: 60,
        periodKind: 'rolling_30d',
      },
    });
  });

  it('returns a customer portal URL after checkout', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/billing/portal')
      .set('Cookie', cookies)
      .expect(201);
    expect(res.body.url).toBe('https://billing.stripe.test/portal');
  });

  it('returns the user to Free when the subscription is deleted', async () => {
    const payload = JSON.stringify({
      id: 'evt_down',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: stripeSubscription,
          customer: stripeCustomer,
          status: 'canceled',
          metadata: { userId },
        },
      },
    });
    await request(app.getHttpServer())
      .post('/api/billing/webhook')
      .set('Stripe-Signature', stripeSignatureHeader(payload, WEBHOOK_SECRET))
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(201);

    const me = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', cookies)
      .expect(200);
    expect(me.body.account).toMatchObject({
      tier: 'free',
      subscriptionStatus: 'canceled',
      limits: {
        attemptsPerPeriod: 3,
        periodKind: 'calendar_week',
      },
    });
  });
});
