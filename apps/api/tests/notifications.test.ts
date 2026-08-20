import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { Notification } from '../src/modules/notifications/notification.model';
import { sendNotification } from '../src/modules/notifications/notification.service';
import { sendDailyReminders } from '../src/modules/notifications/notification.job';
import {
  getChannel,
  EmailChannel,
  PushChannel,
  type OutboundMessage,
  type NotificationChannelAdapter,
} from '../src/modules/notifications/notification.channels';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_notifications';

import { parseAuthCookies } from './helpers/authCookies';

async function signup(email = 'notif@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  const cookies = parseAuthCookies(res);
  return { token: cookies.access, userId: res.body.user.id as string };
}

// Channel resolver that captures whatever would have been sent.
function capturingResolver() {
  const captured: OutboundMessage[] = [];
  const adapter: NotificationChannelAdapter = {
    send: async (m) => {
      captured.push(m);
    },
  };
  return { resolve: () => adapter, captured };
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), RefreshToken.deleteMany({}), Notification.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  redis.disconnect();
});

describe('sendNotification', () => {
  it('dispatches via the channel and marks the record sent', async () => {
    const user = await User.create({ email: 'n@x.com' });
    const { resolve, captured } = capturingResolver();
    const notif = await sendNotification(String(user._id), 'daily-reminder', 'email', resolve);

    expect(notif.status).toBe('sent');
    expect(notif.sentAt).toBeTruthy();
    expect(captured).toHaveLength(1);
    expect(captured[0].to).toBe('n@x.com');
    expect(captured[0].subject).toContain('streak');
  });

  it('records failed (without throwing) when the channel errors', async () => {
    const user = await User.create({ email: 'f@x.com' });
    const resolve = (): NotificationChannelAdapter => ({
      send: async () => {
        throw new Error('smtp down');
      },
    });
    const notif = await sendNotification(String(user._id), 'daily-reminder', 'email', resolve);
    expect(notif.status).toBe('failed');
  });

  it('records failed for a non-existent user', async () => {
    const resolve = (): NotificationChannelAdapter => ({ send: async () => {} });
    const notif = await sendNotification(
      new mongoose.Types.ObjectId().toString(),
      'daily-reminder',
      'email',
      resolve,
    );
    expect(notif.status).toBe('failed');
  });

  it('routes to the requested channel adapter (no refactor to switch)', () => {
    expect(getChannel('push')).toBeInstanceOf(PushChannel);
    expect(getChannel('email')).toBeInstanceOf(EmailChannel);
  });

  it('the push stub delivers without throwing (deferred, but routable)', async () => {
    await expect(
      getChannel('push').send({ to: 'x@x.com', subject: 's', body: 'b' }),
    ).resolves.toBeUndefined();
  });

  it('falls back to a generic message for an unknown type', async () => {
    const user = await User.create({ email: 'u@x.com' });
    const { resolve, captured } = capturingResolver();
    const notif = await sendNotification(String(user._id), 'streak-milestone', 'email', resolve);
    expect(notif.status).toBe('sent');
    expect(captured[0].subject).toBe('Notification');
    expect(captured[0].body).toContain('streak-milestone');
  });
});

describe('sendDailyReminders (cohort selection)', () => {
  it('reminds only opted-in, inactive-today users (timezone-aware)', async () => {
    const now = new Date('2026-07-15T02:00:00Z');
    const optedInInactive = await User.create({
      email: 'a@x.com',
      preferences: { dailyNotification: true, timezone: 'UTC' },
      streak: { current: 1, lastActivityDate: new Date('2026-07-13T12:00:00Z') },
    });
    await User.create({
      email: 'b@x.com', // active today (UTC) → skip
      preferences: { dailyNotification: true, timezone: 'UTC' },
      streak: { current: 1, lastActivityDate: new Date('2026-07-15T01:00:00Z') },
    });
    await User.create({ email: 'c@x.com', preferences: { dailyNotification: false } }); // opted out → skip
    const neverActive = await User.create({
      email: 'd@x.com',
      preferences: { dailyNotification: true, timezone: 'UTC' },
    });
    await User.create({
      email: 'e@x.com', // active "today" in New York even though UTC says yesterday → skip
      preferences: { dailyNotification: true, timezone: 'America/New_York' },
      streak: { current: 1, lastActivityDate: new Date('2026-07-14T16:00:00Z') },
    });

    const calls: string[] = [];
    const fakeSend = (async (userId: string) => {
      calls.push(userId);
      return {} as never;
    }) as typeof sendNotification;

    const sent = await sendDailyReminders(now, fakeSend);
    expect(sent).toBe(2);
    expect(calls.sort()).toEqual(
      [String(optedInInactive._id), String(neverActive._id)].sort(),
    );
  });

  it('is idempotent per day — a second run sends nothing', async () => {
    const now = new Date();
    await User.create({ email: 'i1@x.com', preferences: { dailyNotification: true } });
    await User.create({ email: 'i2@x.com', preferences: { dailyNotification: true } });

    expect(await sendDailyReminders(now)).toBe(2); // real send → EmailChannel no-op → status sent
    expect(await sendDailyReminders(now)).toBe(0); // guarded by same-day sent records
    expect(await Notification.countDocuments({ type: 'daily-reminder', status: 'sent' })).toBe(2);
  });
});

describe('GET /notifications', () => {
  it('returns the current user’s notification history', async () => {
    const { token, userId } = await signup();
    const resolve = (): NotificationChannelAdapter => ({ send: async () => {} });
    await sendNotification(userId, 'daily-reminder', 'email', resolve);

    const res = await request(app).get('/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].type).toBe('daily-reminder');
    expect(res.body.notifications[0].status).toBe('sent');
    // API consistency: exposes `id`, hides `_id`/`__v`.
    expect(res.body.notifications[0].id).toBeTruthy();
    expect(res.body.notifications[0]._id).toBeUndefined();
    expect(res.body.notifications[0].__v).toBeUndefined();
  });

  it('401s without a token', async () => {
    const res = await request(app).get('/notifications');
    expect(res.status).toBe(401);
  });
});
