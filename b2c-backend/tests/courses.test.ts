import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { Worker } from 'bullmq';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { Course } from '../src/modules/courses/course.model';
import { Module } from '../src/modules/modules-content/module.model';
import { Lesson } from '../src/modules/lessons/lesson.model';
import { runCourseGeneration } from '../src/modules/courses/course.service';
import {
  QUEUE_NAMES,
  redisConnectionOptions,
  courseGenerationQueue,
  closeQueues,
} from '../src/jobs/queue';
import { redis } from '../src/config/redis';
import type { GeneratedCourse } from '../src/modules/courses/course.generator';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_courses';
const config = { category: 'Cybersecurity', topics: ['fundamentals'], level: 'beginner' as const };

const fakeTree: GeneratedCourse = {
  title: 'Intro to Cybersecurity',
  modules: [
    {
      title: 'Foundations',
      domain: 'cybersecurity',
      lessons: [
        { title: 'CIA Triad', summary: 'Confidentiality, integrity, availability.' },
        { title: 'Threats', summary: 'Common threat types.' },
      ],
    },
    {
      title: 'Networking Basics',
      domain: 'networking',
      lessons: [{ title: 'Ports', summary: 'Ports and protocols.' }],
    },
  ],
};
const fakeGenerate = async (): Promise<GeneratedCourse> => fakeTree;

async function signup(email = 'learner@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

const generatingCourse = (userId: string, over: Record<string, unknown> = {}) =>
  Course.create({
    userId,
    title: 'Generating…',
    category: 'Cybersecurity',
    topics: ['fundamentals'],
    level: 'beginner',
    status: 'generating',
    moduleOrder: [],
    progressPercent: 0,
    ...over,
  });

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

describe('POST /courses', () => {
  it('creates a generating course and returns 202', async () => {
    const { token } = await signup();
    const res = await request(app).post('/courses').set('Authorization', `Bearer ${token}`).send(config);
    expect(res.status).toBe(202);
    expect(res.body.course.status).toBe('generating');
    expect(res.body.course.id).toBeTruthy();
  });

  it('rejects without a token', async () => {
    const res = await request(app).post('/courses').send(config);
    expect(res.status).toBe(401);
  });

  it('rejects an invalid body (400)', async () => {
    const { token } = await signup();
    const res = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'X', topics: [], level: 'wizard' });
    expect(res.status).toBe(400);
  });

  it('enforces the free-tier 1-active-course limit', async () => {
    const { token } = await signup();
    const first = await request(app).post('/courses').set('Authorization', `Bearer ${token}`).send(config);
    expect(first.status).toBe(202);
    const second = await request(app).post('/courses').set('Authorization', `Bearer ${token}`).send(config);
    expect(second.status).toBe(403);
  });

  it('lets a premium user create multiple active courses', async () => {
    const { token, userId } = await signup();
    await User.updateOne({ _id: userId }, { tier: 'premium' });
    const first = await request(app).post('/courses').set('Authorization', `Bearer ${token}`).send(config);
    const second = await request(app).post('/courses').set('Authorization', `Bearer ${token}`).send(config);
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
  });
});

describe('runCourseGeneration (worker logic)', () => {
  it('builds the tree, persists modules/lessons, and flips status to ready', async () => {
    const { token, userId } = await signup();
    const course = await generatingCourse(userId);
    await runCourseGeneration(String(course._id), fakeGenerate);

    const reloaded = await Course.findById(course._id);
    expect(reloaded!.status).toBe('ready');
    expect(reloaded!.title).toBe('Intro to Cybersecurity');
    expect(reloaded!.moduleOrder).toHaveLength(2);
    expect(await Module.countDocuments({ courseId: course._id })).toBe(2);
    expect(await Lesson.countDocuments()).toBe(3);

    const struct = await request(app)
      .get(`/courses/${course._id}/structure`)
      .set('Authorization', `Bearer ${token}`);
    expect(struct.status).toBe(200);
    expect(struct.body.course.status).toBe('ready');
    expect(struct.body.modules).toHaveLength(2);
    expect(struct.body.modules[0].title).toBe('Foundations');
    expect(struct.body.modules[0].lessonCount).toBe(2);
    expect(struct.body.modules[0].lessons.map((l: { title: string }) => l.title)).toEqual([
      'CIA Triad',
      'Threats',
    ]);
    expect(struct.body.modules[1].domain).toBe('networking');
  });

  it('sets status failed with a reason when generation throws', async () => {
    const { userId } = await signup();
    const course = await generatingCourse(userId);
    await runCourseGeneration(String(course._id), async () => {
      throw new Error('AI exploded');
    });
    const reloaded = await Course.findById(course._id);
    expect(reloaded!.status).toBe('failed');
    expect(reloaded!.failureReason).toContain('AI exploded');
  });

  it('is a no-op when the course is not in generating status (idempotent)', async () => {
    const { userId } = await signup();
    const course = await generatingCourse(userId, { status: 'ready' });
    await runCourseGeneration(String(course._id), fakeGenerate);
    expect(await Module.countDocuments({ courseId: course._id })).toBe(0);
  });

  it('is a no-op for a non-existent course id', async () => {
    const ghostId = new mongoose.Types.ObjectId().toString();
    await expect(runCourseGeneration(ghostId, fakeGenerate)).resolves.toBeUndefined();
    expect(await Module.countDocuments()).toBe(0);
  });
});

describe('course read endpoints', () => {
  it("returns 404 for another user's course", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const course = await generatingCourse(a.userId, { status: 'ready' });
    const res = await request(app)
      .get(`/courses/${course._id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });

  it("lists the user's courses", async () => {
    const { token, userId } = await signup();
    await generatingCourse(userId, { status: 'ready', title: 'c1' });
    const res = await request(app).get('/courses').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.courses).toHaveLength(1);
  });
});

describe('full async flow (BullMQ)', () => {
  it('POST -> worker consumes job -> poll shows ready with full tree', async () => {
    const worker = new Worker(
      QUEUE_NAMES.courseGeneration,
      async (job: { data: { courseId: string } }) => {
        await runCourseGeneration(job.data.courseId, fakeGenerate);
      },
      { connection: redisConnectionOptions() },
    );
    try {
      const { token } = await signup();
      const create = await request(app)
        .post('/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(config);
      expect(create.status).toBe(202);
      expect(create.body.course.status).toBe('generating');
      const id = create.body.course.id;

      let status = 'generating';
      for (let i = 0; i < 80 && status !== 'ready'; i += 1) {
        await new Promise((r) => setTimeout(r, 50));
        const poll = await request(app).get(`/courses/${id}`).set('Authorization', `Bearer ${token}`);
        status = poll.body.course.status;
      }
      expect(status).toBe('ready');

      const struct = await request(app)
        .get(`/courses/${id}/structure`)
        .set('Authorization', `Bearer ${token}`);
      expect(struct.body.modules).toHaveLength(2);
    } finally {
      await worker.close();
    }
  }, 20000);
});
