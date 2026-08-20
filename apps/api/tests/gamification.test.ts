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
import { submitQuiz } from '../src/modules/assessments/quiz.service';
import { Achievement } from '../src/modules/gamification/achievement.model';
import { UserAchievement } from '../src/modules/gamification/userAchievement.model';
import { ACHIEVEMENTS } from '../src/modules/gamification/achievement.catalog';
import {
  seedAchievements,
  evaluateAndAward,
  getMyAchievements,
  listAchievements,
} from '../src/modules/gamification/gamification.service';
import { isStreakStale, resetStaleStreaks } from '../src/modules/gamification/streak.service';
import { completeLesson } from '../src/modules/lessons/lesson.service';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_gamification';
const uid = (): string => new mongoose.Types.ObjectId().toString();
const streakCurrent = (u: { streak?: unknown }): number =>
  (u.streak as { current?: number } | undefined)?.current ?? 0;

import { parseAuthCookies } from './helpers/authCookies';

async function signup(email = 'gam@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  const cookies = parseAuthCookies(res);
  return { token: cookies.access, userId: res.body.user.id as string };
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  await Promise.all([Achievement.init(), UserAchievement.init()]);
  await seedAchievements();
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    RefreshToken.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Lesson.deleteMany({}),
    UserLessonProgress.deleteMany({}),
    Quiz.deleteMany({}),
    QuizSubmission.deleteMany({}),
    UserAchievement.deleteMany({}),
  ]); // Achievement catalog is left seeded across tests
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  redis.disconnect();
});

describe('seedAchievements', () => {
  it('is idempotent', async () => {
    await seedAchievements();
    await seedAchievements();
    expect(await Achievement.countDocuments()).toBe(ACHIEVEMENTS.length);
  });
});

describe('evaluateAndAward', () => {
  it('awards first-lesson once (idempotent)', async () => {
    const u = uid();
    expect(await evaluateAndAward(u, { lessonsCompleted: 1 })).toEqual(['first-lesson']);
    expect(await evaluateAndAward(u, { lessonsCompleted: 1 })).toEqual([]);
    expect(await UserAchievement.countDocuments({ userId: u })).toBe(1);
  });

  it('awards ten-lessons at 10 completed', async () => {
    const awarded = await evaluateAndAward(uid(), { lessonsCompleted: 10 });
    expect(awarded).toContain('first-lesson');
    expect(awarded).toContain('ten-lessons');
  });

  it('awards streak milestones up to the reached threshold only', async () => {
    expect(await evaluateAndAward(uid(), { streak: 7 })).toEqual(['streak-3', 'streak-7']);
    expect(await evaluateAndAward(uid(), { streak: 2 })).toEqual([]);
  });

  it('awards course-complete', async () => {
    expect(await evaluateAndAward(uid(), { courseCompleted: true })).toEqual(['course-complete']);
  });

  it('awards assessment achievements by score', async () => {
    expect(await evaluateAndAward(uid(), { assessmentScore: 100 })).toEqual([
      'assessment-pass',
      'perfect-score',
    ]);
    expect(await evaluateAndAward(uid(), { assessmentScore: 70 })).toEqual(['assessment-pass']);
    expect(await evaluateAndAward(uid(), { assessmentScore: 69 })).toEqual([]);
  });
});

describe('getMyAchievements / listAchievements', () => {
  it('lists the full catalog', async () => {
    expect((await listAchievements()).length).toBe(ACHIEVEMENTS.length);
  });

  it('reports a user’s earned achievements + total', async () => {
    const u = uid();
    await evaluateAndAward(u, { lessonsCompleted: 1, courseCompleted: true });
    const me = await getMyAchievements(u);
    expect(me.total).toBe(ACHIEVEMENTS.length);
    expect(me.earnedCount).toBe(2);
    expect(me.achievements.map((a) => a.key).sort()).toEqual(['course-complete', 'first-lesson']);
    expect(me.achievements[0].earnedAt).toBeTruthy();
  });
});

describe('streak reset', () => {
  it('isStreakStale respects calendar days and timezone', () => {
    const now = new Date('2026-07-16T00:30:00Z');
    expect(isStreakStale(new Date('2026-07-14T14:00:00Z'), now, 'UTC')).toBe(true); // 2 days
    expect(isStreakStale(new Date('2026-07-15T10:00:00Z'), now, 'UTC')).toBe(false); // yesterday
    expect(isStreakStale(new Date('2026-07-16T00:10:00Z'), now, 'UTC')).toBe(false); // today
    // Same instants seen from America/New_York (UTC-4): last=07-14, now=07-15 → 1 day → alive.
    expect(isStreakStale(new Date('2026-07-14T14:00:00Z'), now, 'America/New_York')).toBe(false);
  });

  it('resetStaleStreaks zeroes only streaks that missed a day', async () => {
    const now = new Date('2026-07-15T12:00:00Z');
    const stale = await User.create({
      email: 'stale@x.com',
      streak: { current: 5, lastActivityDate: new Date('2026-07-12T12:00:00Z') },
      preferences: { timezone: 'UTC' },
    });
    const fresh = await User.create({
      email: 'fresh@x.com',
      streak: { current: 3, lastActivityDate: new Date('2026-07-15T01:00:00Z') },
      preferences: { timezone: 'UTC' },
    });

    expect(await resetStaleStreaks(now)).toBe(1);
    expect(streakCurrent((await User.findById(stale._id))!)).toBe(0);
    expect(streakCurrent((await User.findById(fresh._id))!)).toBe(3);
  });
});

describe('award hook: completeLesson', () => {
  it('awards first-lesson + course-complete when a single-lesson course is finished', async () => {
    const user = await User.create({ email: 'learner@x.com' });
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

    const res = await completeLesson(String(user._id), String(lesson._id));
    expect(res.achievements).toContain('first-lesson');
    expect(res.achievements).toContain('course-complete');
    expect((await getMyAchievements(String(user._id))).earnedCount).toBeGreaterThanOrEqual(2);
  });
});

describe('award hook: submitQuiz', () => {
  it('awards assessment achievements end-to-end on a passing score', async () => {
    const u = uid();
    const quiz = await Quiz.create({
      lessonId: new mongoose.Types.ObjectId(),
      userId: u,
      questions: [{ question: 'Q', type: 'mcq', options: ['A', 'B'], correctAnswer: 'A' }],
    });
    await submitQuiz(u, String(quiz._id), [{ questionIndex: 0, answer: 'A' }]);
    const keys = (await getMyAchievements(u)).achievements.map((a) => a.key);
    expect(keys).toContain('assessment-pass');
    expect(keys).toContain('perfect-score');
  });
});

describe('gamification endpoints', () => {
  it('GET /gamification/achievements returns the catalog', async () => {
    const { token } = await signup();
    const res = await request(app)
      .get('/gamification/achievements')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.achievements.length).toBe(ACHIEVEMENTS.length);
  });

  it('GET /gamification/me returns earned + total', async () => {
    const { token, userId } = await signup();
    await evaluateAndAward(userId, { lessonsCompleted: 1 });
    const res = await request(app).get('/gamification/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(ACHIEVEMENTS.length);
    expect(res.body.earnedCount).toBe(1);
    expect(res.body.achievements[0].key).toBe('first-lesson');
  });

  it('401s without a token', async () => {
    const res = await request(app).get('/gamification/me');
    expect(res.status).toBe(401);
  });
});
