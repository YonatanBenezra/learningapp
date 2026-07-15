import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import express from 'express';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { Course } from '../src/modules/courses/course.model';
import { Subscription } from '../src/modules/subscriptions/subscription.model';
import {
  getOrCreateSubscription,
  createCheckout,
  createPortal,
  handleBillingEvent,
  processStripeWebhook,
  reconcileSubscriptions,
} from '../src/modules/subscriptions/subscription.service';
import type { BillingProvider, BillingEvent } from '../src/modules/subscriptions/billing/types';
import { normalize, mapStatus } from '../src/modules/subscriptions/billing/stripe.provider';
import Stripe from 'stripe';
import { requirePremium } from '../src/middlewares/entitlement.middleware';
import { authenticate } from '../src/middlewares/auth.middleware';
import { errorMiddleware } from '../src/middlewares/error.middleware';
import { signAccessToken } from '../src/modules/auth/token.service';
import { jobPriority, courseGenerationQueue, closeQueues } from '../src/jobs/queue';
import { createCourse } from '../src/modules/courses/course.service';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_subscriptions';

// Injectable fake billing provider — no Stripe key needed for happy-paths.
const fakeProvider: BillingProvider = {
  async createCheckoutSession(p) {
    return { url: `https://checkout.test/${p.userId}`, customerId: 'cus_fake123' };
  },
  async createPortalSession(p) {
    return { url: `https://portal.test/${p.customerId}` };
  },
  constructEvent(rawBody) {
    return JSON.parse(rawBody.toString()) as BillingEvent;
  },
  async fetchSubscription() {
    return null;
  },
};

async function signup(email = 'sub@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

const courseInput = (topic: string) => ({
  category: 'Cyber',
  topics: [topic],
  level: 'beginner' as const,
});

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  await Subscription.init(); // unique userId index — upsert race-safety
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    RefreshToken.deleteMany({}),
    Course.deleteMany({}),
    Subscription.deleteMany({}),
  ]);
  await courseGenerationQueue()
    .obliterate({ force: true })
    .catch(() => {});
  // Clear IP rate-limit counters so repeated signups don't trip the auth limiter.
  const keys = await redis.keys('rl:*');
  if (keys.length) await redis.del(...keys);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await closeQueues();
  redis.disconnect();
});

describe('getOrCreateSubscription', () => {
  it('creates a default free subscription and is idempotent', async () => {
    const { userId } = await signup();
    const s1 = await getOrCreateSubscription(userId);
    expect(s1.tier).toBe('free');
    expect(s1.status).toBe('active');
    const s2 = await getOrCreateSubscription(userId);
    expect(String(s1._id)).toBe(String(s2._id));
    expect(await Subscription.countDocuments({ userId })).toBe(1);
  });
});

describe('GET /subscriptions/me', () => {
  it('returns the free default for a new user', async () => {
    const { token } = await signup();
    const res = await request(app)
      .get('/subscriptions/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.subscription.tier).toBe('free');
    expect(res.body.subscription.id).toBeTruthy();
  });

  it('401s without a token', async () => {
    const res = await request(app).get('/subscriptions/me');
    expect(res.status).toBe(401);
  });
});

describe('createCheckout / createPortal', () => {
  it('returns a checkout url and persists the stripe customer id', async () => {
    const { userId } = await signup();
    const { url } = await createCheckout(userId, fakeProvider);
    expect(url).toContain('checkout.test');
    const sub = await Subscription.findOne({ userId });
    expect(sub!.stripeCustomerId).toBe('cus_fake123');
  });

  it('does not overwrite an existing stripe customer id', async () => {
    const { userId } = await signup();
    await Subscription.create({ userId, stripeCustomerId: 'cus_existing', tier: 'free' });
    await createCheckout(userId, fakeProvider);
    expect((await Subscription.findOne({ userId }))!.stripeCustomerId).toBe('cus_existing');
  });

  it('404s checkout for a non-existent user', async () => {
    const ghost = new mongoose.Types.ObjectId().toString();
    await expect(createCheckout(ghost, fakeProvider)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('400s creating a portal before any billing account exists', async () => {
    const { userId } = await signup();
    await expect(createPortal(userId, fakeProvider)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns a portal url once a customer exists', async () => {
    const { userId } = await signup();
    await Subscription.create({ userId, stripeCustomerId: 'cus_x', tier: 'premium' });
    const { url } = await createPortal(userId, fakeProvider);
    expect(url).toContain('portal.test');
  });
});

describe('handleBillingEvent (tier sync)', () => {
  it('upgrade activates premium on both Subscription and User (upserting if needed)', async () => {
    const { userId } = await signup();
    const sub = await handleBillingEvent({
      type: 'subscription.activated',
      userId,
      customerId: 'cus_a',
      subscriptionId: 'sub_a',
      status: 'active',
    });
    expect(sub!.tier).toBe('premium');
    expect(sub!.status).toBe('active');
    expect((await User.findById(userId))!.tier).toBe('premium');
  });

  it('cancellation downgrades to free on both records', async () => {
    const { userId } = await signup();
    await handleBillingEvent({ type: 'subscription.activated', userId, status: 'active' });
    await handleBillingEvent({ type: 'subscription.canceled', userId, status: 'canceled' });
    expect((await Subscription.findOne({ userId }))!.tier).toBe('free');
    expect((await User.findById(userId))!.tier).toBe('free');
  });

  it('retains premium through the past_due dunning grace period', async () => {
    const { userId } = await signup();
    await handleBillingEvent({ type: 'subscription.activated', userId, status: 'active' });
    await handleBillingEvent({ type: 'subscription.updated', userId, status: 'past_due' });
    const sub = await Subscription.findOne({ userId });
    expect(sub!.tier).toBe('premium'); // access continues while Stripe retries
    expect(sub!.status).toBe('past_due');
    expect((await User.findById(userId))!.tier).toBe('premium');
  });

  it('resolves by stripeCustomerId when no userId is present', async () => {
    const { userId } = await signup();
    await Subscription.create({ userId, stripeCustomerId: 'cus_b', tier: 'free' });
    await handleBillingEvent({ type: 'subscription.updated', customerId: 'cus_b', status: 'active' });
    expect((await User.findById(userId))!.tier).toBe('premium');
  });

  it('persists billing detail (priceId, period end, cancelAtPeriodEnd) on update', async () => {
    const { userId } = await signup();
    await Subscription.create({ userId, stripeCustomerId: 'cus_d', tier: 'free' });
    const periodEnd = new Date('2026-08-01T00:00:00Z');
    await handleBillingEvent({
      type: 'subscription.updated',
      customerId: 'cus_d',
      subscriptionId: 'sub_d',
      priceId: 'price_123',
      status: 'active',
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
    });
    const sub = await Subscription.findOne({ userId });
    expect(sub!.priceId).toBe('price_123');
    expect(sub!.stripeSubscriptionId).toBe('sub_d');
    expect(sub!.currentPeriodEnd?.toISOString()).toBe(periodEnd.toISOString());
    expect(sub!.cancelAtPeriodEnd).toBe(true);
  });

  it('returns null when the event carries no userId or customerId', async () => {
    expect(await handleBillingEvent({ type: 'subscription.updated', status: 'active' })).toBeNull();
  });

  it('returns null when no subscription matches the customerId (no upsert)', async () => {
    const result = await handleBillingEvent({
      type: 'subscription.updated',
      customerId: 'cus_unknown',
      status: 'active',
    });
    expect(result).toBeNull();
  });

  it('ignores unrelated events', async () => {
    expect(await handleBillingEvent({ type: 'ignored' })).toBeNull();
  });
});

describe('stripe event normalization', () => {
  const evt = (type: string, object: unknown): Stripe.Event =>
    ({ type, data: { object } }) as unknown as Stripe.Event;

  it('maps checkout.session.completed → activated with ids from metadata', () => {
    const e = normalize(
      evt('checkout.session.completed', {
        metadata: { userId: 'u1' },
        customer: 'cus_1',
        subscription: 'sub_1',
      }),
    );
    expect(e).toMatchObject({
      type: 'subscription.activated',
      userId: 'u1',
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
      status: 'active',
    });
  });

  it('falls back to client_reference_id when metadata has no userId', () => {
    const e = normalize(evt('checkout.session.completed', { client_reference_id: 'u2' }));
    expect(e.userId).toBe('u2');
  });

  it('maps customer.subscription.updated with price + period + cancel flag', () => {
    const e = normalize(
      evt('customer.subscription.updated', {
        id: 'sub_9',
        customer: 'cus_9',
        status: 'active',
        metadata: { userId: 'u9' },
        items: { data: [{ price: { id: 'price_9' } }] },
        current_period_end: 1_781_000_000,
        cancel_at_period_end: true,
      }),
    );
    expect(e).toMatchObject({
      type: 'subscription.updated',
      userId: 'u9',
      priceId: 'price_9',
      status: 'active',
      cancelAtPeriodEnd: true,
    });
    expect(e.currentPeriodEnd).toEqual(new Date(1_781_000_000 * 1000));
  });

  it('maps customer.subscription.deleted → canceled', () => {
    const e = normalize(evt('customer.subscription.deleted', { id: 'sub_x', customer: 'cus_x' }));
    expect(e).toMatchObject({ type: 'subscription.canceled', status: 'canceled' });
  });

  it('maps unknown event types to ignored', () => {
    expect(normalize(evt('invoice.paid', {})).type).toBe('ignored');
  });

  it('mapStatus normalizes stripe statuses', () => {
    expect(mapStatus('active')).toBe('active');
    expect(mapStatus('trialing')).toBe('active');
    expect(mapStatus('past_due')).toBe('past_due');
    expect(mapStatus('canceled')).toBe('canceled');
    expect(mapStatus('unpaid')).toBe('canceled');
    expect(mapStatus('incomplete_expired')).toBe('incomplete');
  });
});

describe('downgrade re-applies free caps (integration)', () => {
  it('premium can hold multiple courses; downgrade blocks the next one', async () => {
    const { userId } = await signup();
    await handleBillingEvent({ type: 'subscription.activated', userId, status: 'active' });

    await createCourse(userId, courseInput('a'));
    await createCourse(userId, courseInput('b'));
    expect(await Course.countDocuments({ userId })).toBe(2);

    await handleBillingEvent({ type: 'subscription.canceled', userId, status: 'canceled' });
    await expect(createCourse(userId, courseInput('c'))).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('processStripeWebhook', () => {
  it('verifies via the provider and applies the event', async () => {
    const { userId } = await signup();
    const event: BillingEvent = {
      type: 'subscription.activated',
      userId,
      customerId: 'cus_w',
      status: 'active',
    };
    await processStripeWebhook(Buffer.from(JSON.stringify(event)), 'sig', fakeProvider);
    expect((await User.findById(userId))!.tier).toBe('premium');
  });

  it('POST /subscriptions/webhook 400s on an invalid signature', async () => {
    const res = await request(app)
      .post('/subscriptions/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'bad-signature')
      .send(JSON.stringify({ type: 'customer.subscription.updated' }));
    expect(res.status).toBe(400);
  });

  // End-to-end proof that the raw-body carve-out delivers exact bytes to the REAL
  // provider: a genuinely-signed event verifies, normalizes, and syncs the tier.
  it('POST /subscriptions/webhook accepts a validly-signed event and syncs the tier', async () => {
    const { userId } = await signup('signed@example.com');
    const stripe = new Stripe('sk_test_dummy');
    const payload = JSON.stringify({
      id: 'evt_signed',
      type: 'checkout.session.completed',
      data: {
        object: { metadata: { userId }, customer: 'cus_signed', subscription: 'sub_signed' },
      },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_test_dummy',
    });

    const res = await request(app)
      .post('/subscriptions/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect((await User.findById(userId))!.tier).toBe('premium');
  });
});

describe('reconcileSubscriptions (Stripe ↔ DB safety net)', () => {
  it('corrects DB drift from the provider (missed cancel webhook)', async () => {
    const { userId } = await signup('drift@example.com');
    await Subscription.create({
      userId,
      tier: 'premium',
      status: 'active',
      stripeSubscriptionId: 'sub_x',
      stripeCustomerId: 'cus_x',
    });
    await User.updateOne({ _id: userId }, { tier: 'premium' });

    const provider = {
      ...fakeProvider,
      fetchSubscription: async (): Promise<BillingEvent> => ({
        type: 'subscription.updated',
        customerId: 'cus_x',
        subscriptionId: 'sub_x',
        status: 'canceled', // Stripe says canceled; DB still says premium
      }),
    };

    expect(await reconcileSubscriptions(provider)).toBe(1);
    expect((await Subscription.findOne({ userId }))!.tier).toBe('free');
    expect((await User.findById(userId))!.tier).toBe('free');
  });

  it('is a no-op when the DB already matches the provider', async () => {
    const { userId } = await signup('insync@example.com');
    await Subscription.create({
      userId,
      tier: 'premium',
      status: 'active',
      stripeSubscriptionId: 'sub_y',
    });
    const provider = {
      ...fakeProvider,
      fetchSubscription: async (): Promise<BillingEvent> => ({
        type: 'subscription.updated',
        subscriptionId: 'sub_y',
        status: 'active',
      }),
    };
    expect(await reconcileSubscriptions(provider)).toBe(0);
    expect((await Subscription.findOne({ userId }))!.tier).toBe('premium');
  });

  it('skips subscriptions the provider cannot fetch', async () => {
    const { userId } = await signup('gone@example.com');
    await Subscription.create({
      userId,
      tier: 'premium',
      status: 'active',
      stripeSubscriptionId: 'sub_z',
    });
    const provider = { ...fakeProvider, fetchSubscription: async (): Promise<BillingEvent | null> => null };
    expect(await reconcileSubscriptions(provider)).toBe(0);
    expect((await Subscription.findOne({ userId }))!.tier).toBe('premium'); // untouched
  });
});

describe('requirePremium', () => {
  it('403s free users and passes premium users', async () => {
    const premApp = express();
    premApp.get('/x', authenticate, requirePremium, (_req, res) => res.json({ ok: true }));
    premApp.use(errorMiddleware);

    const freeToken = signAccessToken({ sub: 'u-free', role: 'user', tier: 'free' });
    const premToken = signAccessToken({ sub: 'u-prem', role: 'user', tier: 'premium' });

    const free = await request(premApp).get('/x').set('Authorization', `Bearer ${freeToken}`);
    const prem = await request(premApp).get('/x').set('Authorization', `Bearer ${premToken}`);
    expect(free.status).toBe(403);
    expect(prem.status).toBe(200);
  });
});

describe('priority AI queue', () => {
  it('jobPriority ranks premium above free', () => {
    expect(jobPriority('premium')).toBe(1);
    expect(jobPriority('free')).toBe(10);
    expect(jobPriority(undefined)).toBe(10);
  });

  it('enqueues course generation with tier-based priority', async () => {
    const prem = await signup('prem@example.com');
    await User.updateOne({ _id: prem.userId }, { tier: 'premium' });
    await createCourse(prem.userId, courseInput('x'));

    const free = await signup('free@example.com');
    await createCourse(free.userId, courseInput('y'));

    const jobs = await courseGenerationQueue().getJobs(['prioritized', 'waiting', 'delayed']);
    const priorities = jobs.map((j) => j.opts.priority ?? 0).sort((a, b) => a - b);
    expect(priorities).toEqual([1, 10]);
  });
});
