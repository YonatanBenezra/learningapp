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
import { Exercise } from '../src/modules/exercises/exercise.model';
import { ExerciseSubmission } from '../src/modules/exercises/submission.model';
import {
  generateExercise,
  type ExerciseGenerator,
} from '../src/modules/exercises/exercise.service';
import {
  gradeExerciseSubmission,
  type SubmissionEvaluator,
} from '../src/modules/exercises/grading.service';
import {
  QUEUE_NAMES,
  redisConnectionOptions,
  gradingQueue,
  closeQueues,
} from '../src/jobs/queue';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_exercises';

const fakeGen: ExerciseGenerator = async () => ({
  description: 'Investigate the SOC alert.',
  starterState: { alert: 'suspicious login' },
  rubric: { criteria: ['identifies the threat'] },
});
const fakeEval: SubmissionEvaluator = async () => ({ score: 80, feedback: 'Good work.' });

async function signup(email = 'learner@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

async function seed(userId: string) {
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
  return { course, mod, lesson };
}

async function seedExercise(userId: string) {
  const { lesson } = await seed(userId);
  const exercise = await Exercise.create({
    lessonId: lesson._id,
    userId,
    domain: 'cybersecurity',
    taskSpec: { description: 'task', starterState: {}, rubric: {} },
  });
  return exercise;
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
    Exercise.deleteMany({}),
    ExerciseSubmission.deleteMany({}),
  ]);
  await gradingQueue()
    .obliterate({ force: true })
    .catch(() => {});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await closeQueues();
  redis.disconnect();
});

describe('exercise generation', () => {
  it('generates an exercise with the module domain and task spec', async () => {
    const { token, userId } = await signup();
    const { lesson } = await seed(userId);
    const exercise = await generateExercise(userId, String(lesson._id), fakeGen);

    expect(exercise.domain).toBe('cybersecurity');
    const res = await request(app).get(`/exercises/${exercise._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.exercise.domain).toBe('cybersecurity');
    expect(res.body.exercise.taskSpec.description).toBe('Investigate the SOC alert.');
  });

  it("404s generating for another user's lesson (before any AI call)", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const { lesson } = await seed(a.userId);
    const res = await request(app)
      .post(`/lessons/${lesson._id}/exercises`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });

  it("falls back to the 'general' domain when the module is missing", async () => {
    const { userId } = await signup();
    const course = await Course.create({
      userId,
      title: 'C',
      category: 'X',
      topics: ['x'],
      level: 'beginner',
      status: 'ready',
      moduleOrder: [],
      progressPercent: 0,
    });
    const lesson = await Lesson.create({
      moduleId: new mongoose.Types.ObjectId(), // module does not exist
      courseId: course._id,
      title: 'L',
      content: { summary: 's' },
      order: 0,
    });
    const exercise = await generateExercise(userId, String(lesson._id), fakeGen);
    expect(exercise.domain).toBe('general');
  });
});

describe('exercise submission', () => {
  it('records a submission as submitted (grading async)', async () => {
    const { token, userId } = await signup();
    const exercise = await seedExercise(userId);
    const res = await request(app)
      .post(`/exercises/${exercise._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ submissionData: { code: 'answer' } });
    expect(res.status).toBe(202);
    expect(res.body.submission.status).toBe('submitted');
  });

  it("404s submitting to another user's exercise", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const exercise = await seedExercise(a.userId);
    const res = await request(app)
      .post(`/exercises/${exercise._id}/submit`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ submissionData: {} });
    expect(res.status).toBe(404);
  });
});

describe('read ownership', () => {
  it("404s reading another user's exercise", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const exercise = await seedExercise(a.userId);
    const res = await request(app)
      .get(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });

  it("404s reading another user's submission", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const exercise = await seedExercise(a.userId);
    const sub = await ExerciseSubmission.create({
      exerciseId: exercise._id,
      userId: a.userId,
      submissionData: {},
      status: 'graded',
      score: 90,
    });
    const res = await request(app)
      .get(`/exercises/submissions/${sub._id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });
});

describe('gradeExerciseSubmission (worker logic)', () => {
  it('transitions submitted -> graded with score + feedback', async () => {
    const { userId } = await signup();
    const exercise = await seedExercise(userId);
    const submission = await ExerciseSubmission.create({
      exerciseId: exercise._id,
      userId,
      submissionData: { code: 'x' },
      status: 'submitted',
    });
    await gradeExerciseSubmission(String(submission._id), fakeEval);

    const graded = await ExerciseSubmission.findById(submission._id);
    expect(graded!.status).toBe('graded');
    expect(graded!.score).toBe(80);
    expect(graded!.feedback).toBe('Good work.');
    expect(graded!.gradedAt).toBeTruthy();
  });

  it("sets 'grading' while the evaluator runs", async () => {
    const { userId } = await signup();
    const exercise = await seedExercise(userId);
    const submission = await ExerciseSubmission.create({
      exerciseId: exercise._id,
      userId,
      submissionData: {},
      status: 'submitted',
    });
    const observing: SubmissionEvaluator = async () => {
      const mid = await ExerciseSubmission.findById(submission._id);
      expect(mid!.status).toBe('grading');
      return { score: 50, feedback: 'ok' };
    };
    await gradeExerciseSubmission(String(submission._id), observing);
    const graded = await ExerciseSubmission.findById(submission._id);
    expect(graded!.status).toBe('graded');
  });

  it('is idempotent — re-grading a graded submission is a no-op', async () => {
    const { userId } = await signup();
    const exercise = await seedExercise(userId);
    const submission = await ExerciseSubmission.create({
      exerciseId: exercise._id,
      userId,
      submissionData: {},
      status: 'submitted',
    });
    let calls = 0;
    const counting: SubmissionEvaluator = async () => {
      calls += 1;
      return { score: 42, feedback: 'once' };
    };
    await gradeExerciseSubmission(String(submission._id), counting);
    await gradeExerciseSubmission(String(submission._id), counting);
    expect(calls).toBe(1);
    const graded = await ExerciseSubmission.findById(submission._id);
    expect(graded!.score).toBe(42);
  });

  it('marks graded with a failure message when the evaluator throws', async () => {
    const { userId } = await signup();
    const exercise = await seedExercise(userId);
    const submission = await ExerciseSubmission.create({
      exerciseId: exercise._id,
      userId,
      submissionData: {},
      status: 'submitted',
    });
    const throwing: SubmissionEvaluator = async () => {
      throw new Error('evaluator exploded');
    };
    await gradeExerciseSubmission(String(submission._id), throwing);
    const graded = await ExerciseSubmission.findById(submission._id);
    expect(graded!.status).toBe('graded');
    expect(graded!.score).toBeNull();
    expect(graded!.feedback).toContain('Grading failed');
  });

  it('is a no-op for a non-existent submission id', async () => {
    const ghost = new mongoose.Types.ObjectId().toString();
    await expect(gradeExerciseSubmission(ghost, fakeEval)).resolves.toBeUndefined();
  });
});

describe('full async flow (BullMQ)', () => {
  it('submit -> worker grades -> poll shows graded with score', async () => {
    const worker = new Worker(
      QUEUE_NAMES.grading,
      async (job: { data: { submissionId: string } }) => {
        await gradeExerciseSubmission(job.data.submissionId, fakeEval);
      },
      { connection: redisConnectionOptions() },
    );
    try {
      const { token, userId } = await signup();
      const exercise = await seedExercise(userId);
      const submit = await request(app)
        .post(`/exercises/${exercise._id}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ submissionData: { code: 'answer' } });
      expect(submit.status).toBe(202);
      const sid = submit.body.submission.id;

      let status = 'submitted';
      for (let i = 0; i < 80 && status !== 'graded'; i += 1) {
        await new Promise((r) => setTimeout(r, 50));
        const poll = await request(app)
          .get(`/exercises/submissions/${sid}`)
          .set('Authorization', `Bearer ${token}`);
        status = poll.body.submission.status;
      }
      expect(status).toBe('graded');

      const final = await request(app)
        .get(`/exercises/submissions/${sid}`)
        .set('Authorization', `Bearer ${token}`);
      expect(final.body.submission.score).toBe(80);
    } finally {
      await worker.close();
    }
  }, 20000);
});
