import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { Course } from '../src/modules/courses/course.model';
import { Module } from '../src/modules/modules-content/module.model';
import { Lesson } from '../src/modules/lessons/lesson.model';
import { UserLessonProgress } from '../src/modules/progress/progress.model';
import { Quiz } from '../src/modules/assessments/quiz.model';
import { QuizSubmission } from '../src/modules/assessments/quizSubmission.model';
import { Exam } from '../src/modules/assessments/exam.model';
import { ExamSubmission } from '../src/modules/assessments/examSubmission.model';
import { Exercise } from '../src/modules/exercises/exercise.model';
import { ExerciseSubmission } from '../src/modules/exercises/submission.model';
import { UserAchievement } from '../src/modules/gamification/userAchievement.model';
import { UsageQuota } from '../src/modules/subscriptions/usageQuota.model';
import { Subscription } from '../src/modules/subscriptions/subscription.model';
import { Notification } from '../src/modules/notifications/notification.model';
import { AiUsage } from '../src/modules/ai-guidance/aiUsage.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { ContentFlag } from '../src/modules/admin/contentFlag.model';
import { captureException, initSentry } from '../src/common/observability/sentry';
import { signAccessToken } from '../src/modules/auth/token.service';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_hardening';
const oid = () => new mongoose.Types.ObjectId().toString();
const adminToken = () => signAccessToken({ sub: oid(), role: 'admin', tier: 'free' });

// True if `field` is covered by a single-field index/unique or any compound index.
function indexed(model: mongoose.Model<unknown>, field: string): boolean {
  const path = model.schema.path(field) as { options?: { index?: unknown; unique?: unknown } } | undefined;
  if (path?.options?.index || path?.options?.unique) return true;
  return model.schema
    .indexes()
    .some(([keys]) => Object.prototype.hasOwnProperty.call(keys, field));
}

describe('index audit (§7.2 — all ref fields indexed)', () => {
  const REF_INDEXES: Array<[mongoose.Model<unknown>, string[]]> = [
    [Course as mongoose.Model<unknown>, ['userId']],
    [Module as mongoose.Model<unknown>, ['courseId']],
    [Lesson as mongoose.Model<unknown>, ['moduleId', 'courseId']],
    [UserLessonProgress as mongoose.Model<unknown>, ['userId', 'lessonId', 'courseId']],
    [Quiz as mongoose.Model<unknown>, ['lessonId', 'userId']],
    [QuizSubmission as mongoose.Model<unknown>, ['quizId', 'userId']],
    [Exam as mongoose.Model<unknown>, ['scopeId', 'userId']],
    [ExamSubmission as mongoose.Model<unknown>, ['examId', 'userId']],
    [Exercise as mongoose.Model<unknown>, ['lessonId', 'userId']],
    [ExerciseSubmission as mongoose.Model<unknown>, ['exerciseId', 'userId']],
    [UserAchievement as mongoose.Model<unknown>, ['userId', 'achievementId']],
    [UsageQuota as mongoose.Model<unknown>, ['userId']],
    [Subscription as mongoose.Model<unknown>, ['userId']],
    [Notification as mongoose.Model<unknown>, ['userId']],
    [AiUsage as mongoose.Model<unknown>, ['userId']],
    [RefreshToken as mongoose.Model<unknown>, ['userId']],
    [ContentFlag as mongoose.Model<unknown>, ['contentId']],
  ];

  it('every referenced field has an index', () => {
    for (const [model, fields] of REF_INDEXES) {
      for (const field of fields) {
        expect(indexed(model, field), `${model.modelName}.${field} must be indexed`).toBe(true);
      }
    }
  });
});

describe('sentry seam (no-op without a DSN)', () => {
  it('init + capture are safe no-ops when SENTRY_DSN is unset', () => {
    initSentry();
    expect(() => captureException(new Error('boom'), { requestId: 'x' })).not.toThrow();
  });
});

describe('platform metrics', () => {
  beforeAll(async () => {
    await mongoose.connect(TEST_DB);
  });

  afterEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      QuizSubmission.deleteMany({}),
      ExerciseSubmission.deleteMany({}),
      AiUsage.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    redis.disconnect();
  });

  const course = (status: string) => ({
    userId: oid(),
    title: 'C',
    category: 'X',
    topics: ['x'],
    level: 'beginner' as const,
    status,
    moduleOrder: [],
    progressPercent: 0,
  });

  it('aggregates users, course-gen rate, submissions, and AI cost', async () => {
    await User.create([
      { email: 'a@x.com', tier: 'premium' },
      { email: 'b@x.com' },
      { email: 'c@x.com', deletedAt: new Date() },
    ]);
    await Course.create([course('ready'), course('failed'), course('generating')]);
    await QuizSubmission.create({ quizId: oid(), userId: oid(), answers: [], results: [], score: 80 });
    await ExerciseSubmission.create({
      exerciseId: oid(),
      userId: oid(),
      submissionData: {},
      status: 'graded',
      score: 50,
    });
    await AiUsage.create({ userId: oid(), useCase: 'course', model: 'm', inputTokens: 1, outputTokens: 1, costUsd: 0.1 });

    const res = await request(app).get('/admin/metrics').set({ Authorization: `Bearer ${adminToken()}` });
    expect(res.status).toBe(200);
    expect(res.body.users).toEqual({ total: 3, active: 2, premium: 1 });
    expect(res.body.courses.total).toBe(3);
    expect(res.body.courses.byStatus.ready).toBe(1);
    expect(res.body.courses.generationSuccessRate).toBeCloseTo(0.5, 5); // 1 ready / (1 ready + 1 failed)
    expect(res.body.courses.generationFailureRate).toBeCloseTo(0.5, 5);
    expect(res.body.assessments.quizSubmissions).toBe(1);
    expect(res.body.exercises.completionRate).toBeCloseTo(1, 5);
    expect(res.body.ai.totalCostUsd).toBeCloseTo(0.1, 5);
    expect(res.body.ai.totalCalls).toBe(1);
  });

  it('403s a non-admin', async () => {
    const t = signAccessToken({ sub: oid(), role: 'user', tier: 'free' });
    const res = await request(app).get('/admin/metrics').set({ Authorization: `Bearer ${t}` });
    expect(res.status).toBe(403);
  });
});
