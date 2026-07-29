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
import type { GeneratedLessonContent } from '../src/modules/courses/lesson.generator';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_courses';
const VALID_TOPICS = [
  'fundamentals',
  'network security',
  'threat modeling',
  'incident response',
  'cryptography',
] as const;

const config = {
  category: 'Cybersecurity',
  topics: [...VALID_TOPICS],
  level: 'beginner' as const,
};

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

const longBody = (topic: string) =>
  [
    `${topic} is an important concept in this module. This section explains what it means in simple terms and why learners should care about it.`,
    'We break the idea into smaller parts so you can follow along even if you are new to the subject. Each part builds on the previous one.',
    'A practical example helps connect theory to real situations. Think about how this idea appears in everyday tools, workflows, or decisions.',
    'Before moving on, review the main terms introduced here and make sure you can explain them in your own words.',
  ].join('\n\n');

const fakeLessonContent = async (input: {
  lessonTitle: string;
  lessonSummary: string;
}): Promise<GeneratedLessonContent> => ({
  summary: `${input.lessonSummary} This lesson walks through the topic step by step so you can read, understand, and then practice with a quiz or exercise.`,
  sections: [
    {
      title: 'Introduction',
      body: longBody(`Introduction to ${input.lessonTitle}`),
      visual: {
        type: 'diagram',
        title: `${input.lessonTitle} at a glance`,
        description: 'A simple diagram showing the main parts of the topic and how they connect.',
        elements: ['Core idea', 'Supporting concepts', 'Real-world use'],
      },
    },
    {
      title: 'Core concepts',
      body: longBody(`Core concepts of ${input.lessonTitle}`),
      visual: {
        type: 'comparison',
        title: 'Before vs after understanding',
        description: 'Compare how beginners and informed learners think about this topic.',
        elements: ['Common misconception', 'Correct mental model'],
      },
    },
    {
      title: 'How it works',
      body: longBody(`How ${input.lessonTitle} works in practice`),
    },
    {
      title: 'Practical application',
      body: longBody(`Applying ${input.lessonTitle} safely and effectively`),
    },
  ],
  keyPoints: [
    'Understand the fundamentals',
    'Recognize common patterns',
    'Apply the concept safely',
    'Review examples before the quiz',
  ],
});

import { parseAuthCookies } from './helpers/authCookies';

async function signup(email = 'learner@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  const cookies = parseAuthCookies(res);
  return { token: cookies.access, userId: res.body.user.id as string };
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

  it('rejects fewer than 5 topics (400)', async () => {
    const { token } = await signup();
    const res = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'Cybersecurity', topics: ['one', 'two'], level: 'beginner' });
    expect(res.status).toBe(400);
  });

  it('rejects more than 6 topics on the free tier (403)', async () => {
    const { token } = await signup();
    const res = await request(app)
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Cybersecurity',
        topics: ['one', 'two', 'three', 'four', 'five', 'six', 'seven'],
        level: 'beginner',
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/6 topics/i);
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
    await runCourseGeneration(String(course._id), fakeGenerate, fakeLessonContent);

    const reloaded = await Course.findById(course._id);
    expect(reloaded!.status).toBe('ready');
    expect(reloaded!.title).toBe('Intro to Cybersecurity');
    expect(reloaded!.moduleOrder).toHaveLength(2);
    expect(await Module.countDocuments({ courseId: course._id })).toBe(2);
    expect(await Lesson.countDocuments()).toBe(3);

    const firstLesson = await Lesson.findOne({ title: 'CIA Triad' });
    expect(firstLesson?.content).toMatchObject({
      summary: expect.any(String),
      sections: expect.arrayContaining([
        expect.objectContaining({ title: expect.any(String), body: expect.any(String) }),
      ]),
      keyPoints: expect.any(Array),
    });

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
    await runCourseGeneration(String(course._id), fakeGenerate, fakeLessonContent);
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
        await runCourseGeneration(job.data.courseId, fakeGenerate, fakeLessonContent);
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
      for (let i = 0; i < 160 && status !== 'ready'; i += 1) {
        await new Promise((r) => setTimeout(r, 100));
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
  }, 30000);
});
