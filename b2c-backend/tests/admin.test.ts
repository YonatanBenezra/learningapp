import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { Course } from '../src/modules/courses/course.model';
import { Module } from '../src/modules/modules-content/module.model';
import { Lesson } from '../src/modules/lessons/lesson.model';
import { Quiz } from '../src/modules/assessments/quiz.model';
import { Exercise } from '../src/modules/exercises/exercise.model';
import { AiUsage } from '../src/modules/ai-guidance/aiUsage.model';
import { Achievement } from '../src/modules/gamification/achievement.model';
import { ContentFlag } from '../src/modules/admin/contentFlag.model';
import { regenerateContent } from '../src/modules/admin/admin.service';
import { signAccessToken } from '../src/modules/auth/token.service';
import { courseGenerationQueue, closeQueues } from '../src/jobs/queue';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_admin';
const oid = () => new mongoose.Types.ObjectId().toString();
const adminToken = () => signAccessToken({ sub: oid(), role: 'admin', tier: 'free' });
const userToken = () => signAccessToken({ sub: oid(), role: 'user', tier: 'free' });
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function seedOwnedQuiz() {
  const user = await User.create({ email: `${oid()}@x.com` });
  const course = await Course.create({
    userId: user._id,
    title: 'C',
    category: 'Cyber',
    topics: ['x'],
    level: 'beginner',
    status: 'ready',
    moduleOrder: [],
    progressPercent: 0,
  });
  const mod = await Module.create({
    courseId: course._id,
    title: 'M',
    domain: 'cybersecurity',
    order: 0,
    lessonOrder: [],
  });
  const lesson = await Lesson.create({
    moduleId: mod._id,
    courseId: course._id,
    title: 'L',
    content: { summary: 's' },
    order: 0,
  });
  const quiz = await Quiz.create({
    lessonId: lesson._id,
    userId: user._id,
    questions: [{ question: 'Q', type: 'mcq', options: ['A', 'B'], correctAnswer: 'A' }],
  });
  return { user, course, mod, lesson, quiz };
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Lesson.deleteMany({}),
    Quiz.deleteMany({}),
    Exercise.deleteMany({}),
    AiUsage.deleteMany({}),
    Achievement.deleteMany({}),
    ContentFlag.deleteMany({}),
  ]);
  await courseGenerationQueue()
    .obliterate({ force: true })
    .catch(() => {});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await closeQueues();
  redis.disconnect();
});

describe('admin auth guard', () => {
  it('403s a non-admin user', async () => {
    const res = await request(app).get('/admin/costs').set(auth(userToken()));
    expect(res.status).toBe(403);
  });

  it('401s without a token', async () => {
    const res = await request(app).get('/admin/costs');
    expect(res.status).toBe(401);
  });
});

describe('AI cost dashboard', () => {
  it('aggregates total + per-useCase + per-model + top users', async () => {
    const uA = oid();
    const uB = oid();
    await AiUsage.create([
      { userId: uA, useCase: 'course', model: 'claude-opus-4-8', inputTokens: 1000, outputTokens: 500, costUsd: 0.05 },
      { userId: uA, useCase: 'quiz', model: 'claude-opus-4-8', inputTokens: 200, outputTokens: 100, costUsd: 0.01 },
      { userId: uB, useCase: 'course', model: 'claude-haiku-4-5', inputTokens: 300, outputTokens: 150, costUsd: 0.02 },
    ]);

    const res = await request(app).get('/admin/costs').set(auth(adminToken()));
    expect(res.status).toBe(200);
    expect(res.body.totalCalls).toBe(3);
    expect(res.body.totalCostUsd).toBeCloseTo(0.08, 5);
    expect(res.body.byUseCase.find((u: { useCase: string }) => u.useCase === 'course').costUsd).toBeCloseTo(0.07, 5);
    expect(res.body.topUsers[0].userId).toBe(uA); // highest spender
    expect(res.body.topUsers[0].costUsd).toBeCloseTo(0.06, 5);
  });

  it('returns zeros when there is no usage yet', async () => {
    const res = await request(app).get('/admin/costs').set(auth(adminToken()));
    expect(res.status).toBe(200);
    expect(res.body.totalCostUsd).toBe(0);
    expect(res.body.totalCalls).toBe(0);
    expect(res.body.byUseCase).toEqual([]);
    expect(res.body.topUsers).toEqual([]);
  });
});

describe('content listing', () => {
  it('lists content of a type with totals', async () => {
    await seedOwnedQuiz();
    await seedOwnedQuiz();
    const res = await request(app).get('/admin/content/course').set(auth(adminToken()));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items).toHaveLength(2);
  });

  it('400s an unknown content type', async () => {
    const res = await request(app).get('/admin/content/widgets').set(auth(adminToken()));
    expect(res.status).toBe(400);
  });

  it('paginates and tolerates non-numeric page/limit', async () => {
    await seedOwnedQuiz();
    await seedOwnedQuiz();
    await seedOwnedQuiz();

    const p1 = await request(app).get('/admin/content/course?page=1&limit=2').set(auth(adminToken()));
    expect(p1.body.items).toHaveLength(2);
    expect(p1.body.total).toBe(3);
    const p2 = await request(app).get('/admin/content/course?page=2&limit=2').set(auth(adminToken()));
    expect(p2.body.items).toHaveLength(1);

    // Garbage params fall back to page 1 / default limit instead of skip(NaN).
    const bad = await request(app)
      .get('/admin/content/course?page=abc&limit=xyz')
      .set(auth(adminToken()));
    expect(bad.status).toBe(200);
    expect(bad.body.page).toBe(1);
    expect(bad.body.items.length).toBe(3);
  });
});

describe('content flags', () => {
  it('flags content, lists it, and resolves it', async () => {
    const { course } = await seedOwnedQuiz();

    const flagRes = await request(app)
      .post(`/admin/content/course/${course._id}/flag`)
      .set(auth(adminToken()))
      .send({ reason: 'Inaccurate module content' });
    expect(flagRes.status).toBe(201);
    expect(flagRes.body.flag.status).toBe('open');
    expect(flagRes.body.flag.id).toBeTruthy();
    const flagId = flagRes.body.flag.id;

    const listRes = await request(app).get('/admin/flags?status=open').set(auth(adminToken()));
    expect(listRes.body.flags).toHaveLength(1);

    const resolveRes = await request(app)
      .post(`/admin/flags/${flagId}/resolve`)
      .set(auth(adminToken()))
      .send({ resolution: 'dismissed' });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.flag.status).toBe('dismissed');
    expect(resolveRes.body.flag.resolvedAt).toBeTruthy();
  });

  it('404s flagging non-existent content', async () => {
    const res = await request(app)
      .post(`/admin/content/course/${oid()}/flag`)
      .set(auth(adminToken()))
      .send({ reason: 'x' });
    expect(res.status).toBe(404);
  });

  it('400s flagging with no reason', async () => {
    const { course } = await seedOwnedQuiz();
    const res = await request(app)
      .post(`/admin/content/course/${course._id}/flag`)
      .set(auth(adminToken()))
      .send({});
    expect(res.status).toBe(400);
  });

  it('404s resolving a non-existent flag', async () => {
    const res = await request(app)
      .post(`/admin/flags/${oid()}/resolve`)
      .set(auth(adminToken()))
      .send({ resolution: 'resolved' });
    expect(res.status).toBe(404);
  });
});

describe('regenerate content', () => {
  it('regenerates a course: clears the tree, flips to generating, enqueues', async () => {
    const { course } = await seedOwnedQuiz();
    expect(await Module.countDocuments({ courseId: course._id })).toBe(1);

    const res = await request(app)
      .post(`/admin/content/course/${course._id}/regenerate`)
      .set(auth(adminToken()));
    expect(res.status).toBe(202);
    expect(res.body.status).toBe('generating');

    expect((await Course.findById(course._id))!.status).toBe('generating');
    expect(await Module.countDocuments({ courseId: course._id })).toBe(0);
    const jobs = await courseGenerationQueue().getJobs(['waiting', 'prioritized', 'delayed']);
    expect(jobs.length).toBeGreaterThanOrEqual(1);
  });

  it('regenerates a quiz via an injected generator (service level)', async () => {
    const { quiz } = await seedOwnedQuiz();
    const fakeGen = async () => ({
      questions: [
        { question: 'New?', type: 'mcq' as const, options: ['Y', 'N'], correctAnswer: 'Y' },
      ],
    });
    const out = await regenerateContent('quiz', String(quiz._id), { quizGenerator: fakeGen });
    expect(out.regenerated).toBe(true);
    expect(await Quiz.countDocuments({ userId: quiz.userId })).toBe(2); // original + regenerated variant
  });

  it('400s regenerating a lesson directly', async () => {
    const { lesson } = await seedOwnedQuiz();
    const res = await request(app)
      .post(`/admin/content/lesson/${lesson._id}/regenerate`)
      .set(auth(adminToken()));
    expect(res.status).toBe(400);
  });
});

describe('achievement management', () => {
  it('creates then updates an achievement definition (upsert)', async () => {
    const create = await request(app)
      .post('/admin/achievements')
      .set(auth(adminToken()))
      .send({ key: 'custom-1', title: 'Custom One', icon: '⭐' });
    expect(create.status).toBe(201);
    expect(create.body.achievement.title).toBe('Custom One');

    const update = await request(app)
      .post('/admin/achievements')
      .set(auth(adminToken()))
      .send({ key: 'custom-1', title: 'Custom One Updated' });
    expect(update.status).toBe(201);
    expect(update.body.achievement.title).toBe('Custom One Updated');
    expect(await Achievement.countDocuments({ key: 'custom-1' })).toBe(1); // upsert, not duplicate
  });
});
