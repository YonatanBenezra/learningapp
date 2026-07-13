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
import { completeLesson, nextStreak } from '../src/modules/lessons/lesson.service';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_lessons';
const T = new Date('2026-07-13T10:00:00Z');
const YESTERDAY = new Date('2026-07-12T10:00:00Z');
const THREE_AGO = new Date('2026-07-10T10:00:00Z');

async function signup(email = 'learner@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

async function seedCourse(userId: string) {
  const course = await Course.create({
    userId,
    title: 'C',
    category: 'Cybersecurity',
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
  const lessons = [];
  for (let i = 0; i < 3; i += 1) {
    lessons.push(
      await Lesson.create({
        moduleId: mod._id,
        courseId: course._id,
        title: `L${i}`,
        content: { summary: `s${i}` },
        order: i,
      }),
    );
  }
  return { course, mod, lessons };
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    RefreshToken.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Lesson.deleteMany({}),
    UserLessonProgress.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('nextStreak (pure)', () => {
  it('starts at 1 when there is no prior activity', () => {
    expect(nextStreak(0, null, T)).toBe(1);
  });
  it('stays unchanged for same-day activity', () => {
    expect(nextStreak(3, T, T)).toBe(3);
  });
  it('increments on a consecutive day', () => {
    expect(nextStreak(3, YESTERDAY, T)).toBe(4);
  });
  it('resets to 1 after a gap', () => {
    expect(nextStreak(5, THREE_AGO, T)).toBe(1);
  });
});

describe('GET /lessons/:id', () => {
  it('returns an owned lesson', async () => {
    const { token, userId } = await signup();
    const { lessons } = await seedCourse(userId);
    const res = await request(app)
      .get(`/lessons/${lessons[0]._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.lesson.title).toBe('L0');
  });

  it('401s without a token', async () => {
    const res = await request(app).get(`/lessons/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(401);
  });

  it("404s for another user's lesson", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const { lessons } = await seedCourse(a.userId);
    const res = await request(app)
      .get(`/lessons/${lessons[0]._id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });

  it('404s for a malformed lesson id', async () => {
    const { token } = await signup();
    const res = await request(app).get('/lessons/not-an-id').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('lesson progress + streak + course %', () => {
  it('start marks in_progress; complete marks completed and updates course %', async () => {
    const { token, userId } = await signup();
    const { course, lessons } = await seedCourse(userId);

    const started = await request(app)
      .post(`/lessons/${lessons[0]._id}/start`)
      .set('Authorization', `Bearer ${token}`);
    expect(started.status).toBe(200);
    expect(started.body.progress.status).toBe('in_progress');

    const completed = await request(app)
      .post(`/lessons/${lessons[0]._id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(completed.status).toBe(200);
    expect(completed.body.progress.status).toBe('completed');
    expect(completed.body.streak.current).toBe(1);
    expect(completed.body.course.progressPercent).toBe(33); // 1 of 3

    const reloaded = await Course.findById(course._id);
    expect(reloaded!.progressPercent).toBe(33);
    expect(reloaded!.status).toBe('ready');
  });

  it('reaches 100% and marks the course completed', async () => {
    const { token, userId } = await signup();
    const { course, lessons } = await seedCourse(userId);
    for (const l of lessons) {
      await request(app).post(`/lessons/${l._id}/complete`).set('Authorization', `Bearer ${token}`);
    }
    const reloaded = await Course.findById(course._id);
    expect(reloaded!.progressPercent).toBe(100);
    expect(reloaded!.status).toBe('completed');
  });

  it('is idempotent — completing twice does not double-count', async () => {
    const { token, userId } = await signup();
    const { lessons } = await seedCourse(userId);
    await request(app).post(`/lessons/${lessons[0]._id}/complete`).set('Authorization', `Bearer ${token}`);
    const second = await request(app)
      .post(`/lessons/${lessons[0]._id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(second.body.course.progressPercent).toBe(33);
    expect(second.body.streak.current).toBe(1); // same-day re-complete must not bump the streak
    expect(await UserLessonProgress.countDocuments({ userId })).toBe(1);
  });

  it('start does not downgrade a completed lesson', async () => {
    const { token, userId } = await signup();
    const { lessons } = await seedCourse(userId);
    await request(app).post(`/lessons/${lessons[0]._id}/complete`).set('Authorization', `Bearer ${token}`);
    const started = await request(app)
      .post(`/lessons/${lessons[0]._id}/start`)
      .set('Authorization', `Bearer ${token}`);
    expect(started.body.progress.status).toBe('completed');
  });

  it('increments the streak on a consecutive day (injected now)', async () => {
    const { userId } = await signup();
    const { lessons } = await seedCourse(userId);
    await User.updateOne({ _id: userId }, { streak: { current: 2, lastActivityDate: YESTERDAY } });
    const result = await completeLesson(userId, String(lessons[0]._id), T);
    expect(result.streak!.current).toBe(3);
  });
});

describe('indexes', () => {
  it('enforces the unique (userId, lessonId) progress index', async () => {
    const { userId } = await signup();
    const { lessons } = await seedCourse(userId);
    await UserLessonProgress.init(); // wait for index builds
    await UserLessonProgress.create({
      userId,
      lessonId: lessons[0]._id,
      courseId: lessons[0].courseId,
      status: 'completed',
    });
    await expect(
      UserLessonProgress.create({
        userId,
        lessonId: lessons[0]._id,
        courseId: lessons[0].courseId,
        status: 'in_progress',
      }),
    ).rejects.toThrow();
  });
});

describe('GET /progress', () => {
  it('lists all progress and filters by courseId (excluding other courses)', async () => {
    const { token, userId } = await signup();
    const auth = { Authorization: `Bearer ${token}` };
    const a = await seedCourse(userId);
    const b = await seedCourse(userId);

    await request(app).post(`/lessons/${a.lessons[0]._id}/complete`).set(auth);
    await request(app).post(`/lessons/${b.lessons[0]._id}/complete`).set(auth);
    await request(app).post(`/lessons/${b.lessons[1]._id}/start`).set(auth);

    const all = await request(app).get('/progress').set(auth);
    expect(all.status).toBe(200);
    expect(all.body.progress).toHaveLength(3);

    const onlyA = await request(app).get(`/progress?courseId=${a.course._id}`).set(auth);
    expect(onlyA.body.progress).toHaveLength(1);

    const onlyB = await request(app).get(`/progress?courseId=${b.course._id}`).set(auth);
    expect(onlyB.body.progress).toHaveLength(2);
  });
});
