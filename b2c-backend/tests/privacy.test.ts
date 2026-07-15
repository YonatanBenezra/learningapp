import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
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
import { Subscription } from '../src/modules/subscriptions/subscription.model';
import { UsageQuota } from '../src/modules/subscriptions/usageQuota.model';
import { Notification } from '../src/modules/notifications/notification.model';
import { AiUsage } from '../src/modules/ai-guidance/aiUsage.model';
import {
  exportUserData,
  softDeleteUser,
  deleteAllUserData,
  purgeDeletedUsers,
} from '../src/modules/privacy/privacy.service';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_privacy';

async function signup(email = 'priv@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  return {
    token: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
    userId: res.body.user.id as string,
    email,
  };
}

async function seedUserData(userId: string) {
  const course = await Course.create({
    userId,
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
  const [quiz, exercise, exam] = await Promise.all([
    Quiz.create({
      lessonId: lesson._id,
      userId,
      questions: [{ question: 'q', type: 'mcq', options: ['a', 'b'], correctAnswer: 'a' }],
    }),
    Exercise.create({
      lessonId: lesson._id,
      userId,
      domain: 'cybersecurity',
      taskSpec: { description: 'd', starterState: {}, rubric: {} },
    }),
    Exam.create({
      scope: 'course',
      scopeId: course._id,
      userId,
      questions: [{ question: 'q', type: 'mcq', options: ['a', 'b'], correctAnswer: 'a' }],
    }),
    UserLessonProgress.create({
      userId,
      lessonId: lesson._id,
      courseId: course._id,
      status: 'completed',
      completedAt: new Date(),
    }),
    Subscription.create({ userId, tier: 'free', status: 'active' }),
    Notification.create({ userId, type: 'daily-reminder', channel: 'email', status: 'sent' }),
    AiUsage.create({ userId, useCase: 'course', model: 'm', inputTokens: 1, outputTokens: 1, costUsd: 0.01 }),
    UsageQuota.create({
      userId,
      period: 'daily',
      periodStart: new Date(),
      counts: {
        courseGenerations: 1,
        exerciseGenerations: 0,
        quizGenerations: 0,
        examGenerations: 0,
        labExecutions: 0,
      },
    }),
  ]);
  await Promise.all([
    QuizSubmission.create({ quizId: quiz._id, userId, answers: [], results: [], score: 0 }),
    ExamSubmission.create({ examId: exam._id, userId, answers: [], results: [], score: 0 }),
    ExerciseSubmission.create({
      exerciseId: exercise._id,
      userId,
      submissionData: {},
      status: 'graded',
      score: 50,
    }),
  ]);
  return { course, mod, lesson, quiz, exercise, exam };
}

const COLLECTIONS = [
  User,
  RefreshToken,
  Course,
  Module,
  Lesson,
  UserLessonProgress,
  Quiz,
  QuizSubmission,
  Exam,
  ExamSubmission,
  Exercise,
  ExerciseSubmission,
  Subscription,
  UsageQuota,
  Notification,
  AiUsage,
];

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterEach(async () => {
  await Promise.all(COLLECTIONS.map((m) => m.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  redis.disconnect();
});

describe('exportUserData', () => {
  it('returns a complete portable dataset across all collections', async () => {
    const user = await User.create({ email: 'export@x.com' });
    await seedUserData(String(user._id));

    const data = await exportUserData(String(user._id));
    expect(data.exportedAt).toBeTruthy();
    expect(data.user).toBeTruthy();
    expect(data.courses).toHaveLength(1);
    expect(data.modules).toHaveLength(1);
    expect(data.lessons).toHaveLength(1);
    expect(data.progress).toHaveLength(1);
    expect(data.quizzes).toHaveLength(1);
    expect(data.quizSubmissions).toHaveLength(1);
    expect(data.exams).toHaveLength(1);
    expect(data.examSubmissions).toHaveLength(1);
    expect(data.exercises).toHaveLength(1);
    expect(data.exerciseSubmissions).toHaveLength(1);
    expect(data.subscription).toBeTruthy();
    expect(data.notifications).toHaveLength(1);
    expect(data.aiUsage).toHaveLength(1);
    expect(data.usageQuota).toHaveLength(1);
  });

  it('serves the export over HTTP without leaking the password hash', async () => {
    const { token, userId } = await signup();
    await seedUserData(userId);
    const res = await request(app).get('/users/me/export').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.courses).toHaveLength(1);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('401s the export without a token', async () => {
    const res = await request(app).get('/users/me/export');
    expect(res.status).toBe(401);
  });
});

describe('soft delete', () => {
  it('sets deletedAt and revokes refresh tokens', async () => {
    const { userId } = await signup();
    await softDeleteUser(userId);
    expect((await User.findById(userId))!.get('deletedAt')).toBeTruthy();
    const tokens = await RefreshToken.find({ userId });
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((t) => t.revoked)).toBe(true);
  });

  it('DELETE /users/me soft-deletes and then blocks login (403)', async () => {
    const { token, email } = await signup('bye@example.com');
    const del = await request(app).delete('/users/me').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.status).toBe('deleted');

    const login = await request(app).post('/auth/login').send({ email, password: 'supersecret1' });
    expect(login.status).toBe(403);
  });

  it('blocks refresh after soft-delete', async () => {
    const { refreshToken, userId } = await signup('r@example.com');
    await softDeleteUser(userId);
    const res = await request(app).post('/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it('401s DELETE /users/me without a token', async () => {
    const res = await request(app).delete('/users/me');
    expect(res.status).toBe(401);
  });

  it('is idempotent — repeated deletes keep the original deletedAt (purge clock not reset)', async () => {
    const { userId } = await signup('idem@example.com');
    const first = await softDeleteUser(userId);
    const firstDeletedAt = (first.get('deletedAt') as Date).getTime();
    const second = await softDeleteUser(userId);
    expect((second.get('deletedAt') as Date).getTime()).toBe(firstDeletedAt);
  });
});

describe('cascade delete', () => {
  it('deleteAllUserData removes the user and every owned document', async () => {
    const user = await User.create({ email: 'cascade@x.com' });
    const id = String(user._id);
    await seedUserData(id);

    await deleteAllUserData(id);

    expect(await User.findById(id)).toBeNull();
    for (const [model, filter] of [
      [Course, { userId: id }],
      [UserLessonProgress, { userId: id }],
      [Quiz, { userId: id }],
      [QuizSubmission, { userId: id }],
      [Exam, { userId: id }],
      [ExamSubmission, { userId: id }],
      [Exercise, { userId: id }],
      [ExerciseSubmission, { userId: id }],
      [Subscription, { userId: id }],
      [Notification, { userId: id }],
      [AiUsage, { userId: id }],
      [UsageQuota, { userId: id }],
    ] as const) {
      expect(await (model as mongoose.Model<unknown>).countDocuments(filter)).toBe(0);
    }
    expect(await Module.countDocuments()).toBe(0);
    expect(await Lesson.countDocuments()).toBe(0);
  });
});

describe('purge job', () => {
  it('hard-deletes accounts past the retention window, keeps recent ones', async () => {
    const now = new Date('2026-07-15T12:00:00Z');
    const old = await User.create({ email: 'old@x.com', deletedAt: new Date('2026-06-01T00:00:00Z') });
    await seedUserData(String(old._id));
    const recent = await User.create({
      email: 'recent@x.com',
      deletedAt: new Date('2026-07-14T00:00:00Z'),
    });

    const purged = await purgeDeletedUsers(now, 30);
    expect(purged).toBe(1);
    expect(await User.findById(old._id)).toBeNull();
    expect(await Course.countDocuments({ userId: old._id })).toBe(0);
    expect(await User.findById(recent._id)).toBeTruthy(); // still within the window
  });

  it('does not purge active (non-deleted) users', async () => {
    await User.create({ email: 'active@x.com' }); // deletedAt null
    expect(await purgeDeletedUsers(new Date(), 30)).toBe(0);
  });
});
