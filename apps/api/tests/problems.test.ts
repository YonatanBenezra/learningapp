import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { Problem } from '../src/modules/problems/problem.model';
import { ProblemSubmission } from '../src/modules/problems/problemSubmission.model';
import { UserPracticeProgress } from '../src/modules/problems/userPracticeProgress.model';
import { seedProblems } from '../src/modules/problems/problem.service';
import { parseAuthCookies, cookieHeader } from './helpers/authCookies';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_problems';

async function signup(email = 'practice@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  const cookies = cookieHeader(parseAuthCookies(res));
  return { cookies, userId: res.body.user.id as string };
}

describe('problems API', () => {
  beforeAll(async () => {
    await mongoose.connect(TEST_DB);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Problem.deleteMany({}),
      ProblemSubmission.deleteMany({}),
      UserPracticeProgress.deleteMany({}),
    ]);
    await seedProblems();
  });

  it('lists seeded problems', async () => {
    const res = await request(app).get('/problems');
    expect(res.status).toBe(200);
    expect(res.body.problems.length).toBeGreaterThanOrEqual(15);
  });

  it('returns a problem without correctAnswer', async () => {
    const res = await request(app).get('/problems/prompt-engineering-1');
    expect(res.status).toBe(200);
    expect(res.body.problem.slug).toBe('prompt-engineering-1');
    expect(res.body.problem.correctAnswer).toBeUndefined();
    expect(res.body.problem.options?.length).toBeGreaterThan(0);
  });

  it('grades guest MCQ submit', async () => {
    const problem = await Problem.findOne({ slug: 'prompt-engineering-1' }).lean();
    const res = await request(app)
      .post('/problems/prompt-engineering-1/submit')
      .send({
        guestSessionId: '550e8400-e29b-41d4-a716-446655440000',
        answer: problem!.correctAnswer,
        completedCount: 0,
      });
    expect(res.status).toBe(201);
    expect(res.body.result.correct).toBe(true);
    expect(res.body.result.score).toBe(100);
  });

  it('blocks guest submit after free limit', async () => {
    const res = await request(app)
      .post('/problems/prompt-engineering-1/submit')
      .send({
        guestSessionId: '550e8400-e29b-41d4-a716-446655440000',
        answer: 'wrong',
        completedCount: 3,
      });
    expect(res.status).toBe(403);
  });

  it('syncs guest bundle after login', async () => {
    const { cookies } = await signup();
    const payload = {
      version: 1 as const,
      guestSessionId: '550e8400-e29b-41d4-a716-446655440001',
      freeLimit: 3,
      completedCount: 1,
      synced: false,
      submissions: [
        {
          problemSlug: 'prompt-engineering-1',
          topic: 'Prompt Engineering',
          difficulty: 'easy',
          type: 'mcq',
          answer: 'x',
          score: 0,
          correct: false,
          feedback: 'Incorrect.',
          submittedAt: new Date().toISOString(),
        },
      ],
      skillByTopic: {
        'Prompt Engineering': {
          attempted: 1,
          passed: 0,
          avgScore: 0,
          level: 'beginner' as const,
        },
      },
      completedSlugs: ['prompt-engineering-1'],
    };

    const res = await request(app)
      .post('/practice/sync')
      .set('Cookie', cookies)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.summary.merged).toBe(1);

    const progress = await UserPracticeProgress.findOne({}).lean();
    expect(progress?.completedSlugs).toContain('prompt-engineering-1');
  });
});
