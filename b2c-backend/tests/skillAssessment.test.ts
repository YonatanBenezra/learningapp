import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { Worker } from 'bullmq';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { SkillAssessment } from '../src/modules/assessments/skillAssessment.model';
import { SkillAssessmentSubmission } from '../src/modules/assessments/skillAssessmentSubmission.model';
import {
  generateSkillAssessment,
  runSkillAssessmentGeneration,
  submitSkillAssessment,
  scoreToLevel,
  type SkillAssessmentGenerator,
} from '../src/modules/assessments/skillAssessment.service';
import { redis } from '../src/config/redis';
import { QUEUE_NAMES, redisConnectionOptions, skillAssessmentGenerationQueue } from '../src/jobs/queue';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_skill_assessment';

const mcqQuestions = Array.from({ length: 10 }, (_, i) => ({
  question: `Question ${i + 1}?`,
  type: 'mcq' as const,
  options: ['A', 'B', 'C', 'D'],
  correctAnswer: 'A',
}));

const fakeGen: SkillAssessmentGenerator = async () => ({ questions: mcqQuestions });

import { parseAuthCookies } from './helpers/authCookies';

async function signup(email = 'skill@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  const cookies = parseAuthCookies(res);
  return { token: cookies.access, userId: res.body.user.id as string };
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  if (redis.status !== 'ready') await redis.connect();
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    RefreshToken.deleteMany({}),
    SkillAssessment.deleteMany({}),
    SkillAssessmentSubmission.deleteMany({}),
  ]);
  const keys = await redis.keys('rl:*');
  if (keys.length) await redis.del(...keys);
  const jobs = await skillAssessmentGenerationQueue().getJobs([
    'waiting',
    'active',
    'delayed',
    'prioritized',
  ]);
  await Promise.all(jobs.map((job) => job.remove().catch(() => undefined)));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  redis.disconnect();
});

describe('scoreToLevel', () => {
  it('maps score ranges to skill levels', () => {
    expect(scoreToLevel(20)).toBe('Beginner');
    expect(scoreToLevel(50)).toBe('Intermediate');
    expect(scoreToLevel(75)).toBe('Advanced');
    expect(scoreToLevel(95)).toBe('Expert');
  });
});

describe('skill assessment API', () => {
  it('lists predefined topics', async () => {
    const res = await request(app).get('/skill-assessments/topics');
    expect(res.status).toBe(200);
    expect(res.body.topics).toContain('Programming');
    expect(res.body.topics).toContain('Other');
  });

  it('generates a guest assessment and serves it without answers', async () => {
    const assessment = await generateSkillAssessment(
      { topic: 'Programming', guestSessionId: crypto.randomUUID() },
      undefined,
      'free',
      fakeGen,
    );

    const res = await request(app).get(`/skill-assessments/${assessment!.id}`);
    expect(res.status).toBe(200);
    expect(res.body.assessment.status).toBe('ready');
    expect(res.body.assessment.questions).toHaveLength(10);
    expect(res.body.assessment.questions[0].correctAnswer).toBeUndefined();
  });

  it('requires auth to submit and returns level + score', async () => {
    const { token, userId } = await signup();
    const assessment = await generateSkillAssessment({ topic: 'Networking' }, userId, 'free', fakeGen);

    const unauth = await request(app)
      .post(`/skill-assessments/${assessment!.id}/submit`)
      .send({ answers: [{ questionIndex: 0, answer: 'A' }] });
    expect(unauth.status).toBe(401);

    const stored = await SkillAssessment.findById(assessment!.id).lean();
    const answers = (stored?.questions ?? []).map((q, i) => ({
      questionIndex: i,
      answer: (q as { correctAnswer: string }).correctAnswer,
    }));
    const submission = await submitSkillAssessment(userId, assessment!.id, answers);
    expect(submission.score).toBe(100);
    expect(submission.level).toBe('Expert');

    const res = await request(app)
      .get(`/skill-assessments/${assessment!.id}/result`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.submission.level).toBe('Expert');
    expect(res.body.submission.score).toBe(100);
  });

  it('rejects duplicate submission', async () => {
    const { userId } = await signup('dup@example.com');
    const assessment = await generateSkillAssessment({ topic: 'General' }, userId, 'free', fakeGen);
    const stored = await SkillAssessment.findById(assessment!.id).lean();
    const answers = (stored?.questions ?? []).map((q, i) => ({
      questionIndex: i,
      answer: (q as { correctAnswer: string }).correctAnswer,
    }));
    await submitSkillAssessment(userId, assessment!.id, answers);
    await expect(submitSkillAssessment(userId, assessment!.id, answers)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('validates Other topic requires customTopic on generate', async () => {
    const res = await request(app)
      .post('/skill-assessments/generate')
      .send({ topic: 'Other' });
    expect(res.status).toBe(400);
  });

  it('lists guest assessments and enforces free-plan quota', async () => {
    const guestSessionId = crypto.randomUUID();
    for (let i = 0; i < 5; i += 1) {
      await generateSkillAssessment({ topic: 'General', guestSessionId }, undefined, 'free', fakeGen);
    }

    const list = await request(app)
      .get('/skill-assessments/mine')
      .query({ guestSessionId });
    expect(list.status).toBe(200);
    expect(list.body.assessments).toHaveLength(5);
    expect(list.body.quota.used).toBe(5);
    expect(list.body.quota.remaining).toBe(0);

    const blocked = await request(app)
      .post('/skill-assessments/generate')
      .send({ topic: 'Programming', guestSessionId });
    expect(blocked.status).toBe(429);
  });

  it('returns 401 when bearer token is invalid on list', async () => {
    const res = await request(app)
      .get('/skill-assessments/mine')
      .set('Authorization', 'Bearer invalid-token')
      .query({ guestSessionId: crypto.randomUUID() });
    expect(res.status).toBe(401);
  });

  it('claims guest assessments for authenticated user on list', async () => {
    const { token, userId } = await signup('claim-list@example.com');
    const guestSessionId = crypto.randomUUID();

    await generateSkillAssessment({ topic: 'Programming', guestSessionId }, undefined, 'free', fakeGen);
    await generateSkillAssessment({ topic: 'Networking', guestSessionId }, undefined, 'free', fakeGen);
    await generateSkillAssessment({ topic: 'General' }, userId, 'free', fakeGen);

    const list = await request(app)
      .get('/skill-assessments/mine')
      .set('Authorization', `Bearer ${token}`)
      .query({ guestSessionId });

    expect(list.status).toBe(200);
    expect(list.body.assessments).toHaveLength(3);
    expect(list.body.quota.used).toBe(3);

    const claimed = await SkillAssessment.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });
    expect(claimed).toBe(3);
  });

  it('marks guest assessment completed after authenticated submit', async () => {
    const { token, userId } = await signup('claimed@example.com');
    const guestSessionId = crypto.randomUUID();
    const assessment = await generateSkillAssessment(
      { topic: 'Cyber Security', guestSessionId },
      undefined,
      'free',
      fakeGen,
    );
    const stored = await SkillAssessment.findById(assessment!.id).lean();
    const answers = (stored?.questions ?? []).map((q, i) => ({
      questionIndex: i,
      answer: (q as { correctAnswer: string }).correctAnswer,
    }));
    await submitSkillAssessment(userId, assessment!.id, answers);

    const list = await request(app)
      .get('/skill-assessments/mine')
      .set('Authorization', `Bearer ${token}`)
      .query({ guestSessionId });
    expect(list.status).toBe(200);
    expect(list.body.assessments).toHaveLength(1);
    expect(list.body.assessments[0].status).toBe('completed');
    expect(list.body.assessments[0].submission.score).toBe(100);
  });
});

describe('full async flow (BullMQ)', () => {
  it(
    'POST -> worker consumes job -> poll shows ready with questions',
    async () => {
      const worker = new Worker(
        QUEUE_NAMES.skillAssessmentGeneration,
        async (job: { data: { assessmentId: string } }) => {
          await runSkillAssessmentGeneration(job.data.assessmentId, fakeGen);
        },
        { connection: redisConnectionOptions() },
      );
      await worker.waitUntilReady();
      try {
        const guestSessionId = crypto.randomUUID();
        const create = await request(app)
          .post('/skill-assessments/generate')
          .send({ topic: 'Programming', guestSessionId });
        expect(create.status).toBe(202);
        expect(create.body.assessment.status).toBe('generating');
        const id = create.body.assessment.id;

        let status = 'generating';
        for (let i = 0; i < 160 && status === 'generating'; i += 1) {
          await new Promise((r) => setTimeout(r, 100));
          const poll = await request(app).get(`/skill-assessments/${id}`);
          status = poll.body.assessment.status;
        }
        expect(status).toBe('ready');

        const poll = await request(app).get(`/skill-assessments/${id}`);
        expect(poll.body.assessment.questions).toHaveLength(10);
      } finally {
        await worker.close();
      }
    },
    30000,
  );
});
