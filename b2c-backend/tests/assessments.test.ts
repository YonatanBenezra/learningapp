import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { RefreshToken } from '../src/modules/auth/refreshToken.model';
import { Course } from '../src/modules/courses/course.model';
import { Module } from '../src/modules/modules-content/module.model';
import { Lesson } from '../src/modules/lessons/lesson.model';
import { Quiz } from '../src/modules/assessments/quiz.model';
import { QuizSubmission } from '../src/modules/assessments/quizSubmission.model';
import { Exam } from '../src/modules/assessments/exam.model';
import { ExamSubmission } from '../src/modules/assessments/examSubmission.model';
import { gradeSubmission, type ShortAnswerJudge } from '../src/modules/assessments/grading.service';
import { generateQuiz, submitQuiz, type QuizGenerator } from '../src/modules/assessments/quiz.service';
import { generateModuleExam, generateCourseExam } from '../src/modules/assessments/exam.service';
import type { GeneratedQuestion } from '../src/modules/assessments/assessment.schema';
import { redis } from '../src/config/redis';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_assessments';

const mcqQuestions = [
  { question: 'Capital of France?', type: 'mcq', options: ['Paris', 'London'], correctAnswer: 'Paris' },
  { question: '2+2?', type: 'mcq', options: ['3', '4'], correctAnswer: '4' },
];
const fakeGen: QuizGenerator = async () => ({ questions: mcqQuestions as GeneratedQuestion[] });
const noJudge: ShortAnswerJudge = async () => {
  throw new Error('AI judge must not be called for MCQ');
};

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
    Quiz.deleteMany({}),
    QuizSubmission.deleteMany({}),
    Exam.deleteMany({}),
    ExamSubmission.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  redis.disconnect();
});

describe('gradeSubmission', () => {
  it('grades MCQ rule-based without calling the AI judge', async () => {
    const questions = mcqQuestions as GeneratedQuestion[];
    const answers = [
      { questionIndex: 0, answer: 'Paris' },
      { questionIndex: 1, answer: '3' },
    ];
    const { score, results } = await gradeSubmission(questions, answers, noJudge);
    expect(score).toBe(50);
    expect(results[0].correct).toBe(true);
    expect(results[1].correct).toBe(false);
    expect(results[1].correctAnswer).toBe('4');
  });

  it('matches MCQ case-insensitively and trimmed', async () => {
    const questions = [
      { question: 'q', type: 'mcq', options: ['Paris'], correctAnswer: 'Paris' },
    ] as GeneratedQuestion[];
    const { score } = await gradeSubmission(questions, [{ questionIndex: 0, answer: '  paris ' }], noJudge);
    expect(score).toBe(100);
  });

  it('grades short-answer via the injected judge', async () => {
    const questions = [
      { question: 'Explain X', type: 'short_answer', options: null, correctAnswer: 'ref' },
    ] as GeneratedQuestion[];
    const judge: ShortAnswerJudge = async () => ({ correct: true, feedback: 'Good.' });
    const { score, results } = await gradeSubmission(
      questions,
      [{ questionIndex: 0, answer: 'my answer' }],
      judge,
    );
    expect(score).toBe(100);
    expect(results[0].feedback).toBe('Good.');
  });
});

describe('quiz generation + fetch', () => {
  it('generates a quiz and hides correct answers when fetched', async () => {
    const { token, userId } = await signup();
    const { lesson } = await seed(userId);
    const quiz = await generateQuiz(userId, String(lesson._id), fakeGen);

    const res = await request(app).get(`/quizzes/${quiz._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.quiz.questions).toHaveLength(2);
    expect(res.body.quiz.questions[0].question).toBe('Capital of France?');
    expect(res.body.quiz.questions[0].correctAnswer).toBeUndefined();
  });

  it('regeneration produces a fresh quiz variant', async () => {
    const { userId } = await signup();
    const { lesson } = await seed(userId);
    const q1 = await generateQuiz(userId, String(lesson._id), fakeGen);
    const q2 = await generateQuiz(userId, String(lesson._id), fakeGen);
    expect(String(q1._id)).not.toBe(String(q2._id));
    expect(await Quiz.countDocuments({ userId })).toBe(2);
  });

  it("404s generating a quiz for another user's lesson (before any AI call)", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const { lesson } = await seed(a.userId);
    const res = await request(app)
      .post(`/lessons/${lesson._id}/quizzes`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });
});

describe('quiz submission', () => {
  it('submits and returns score + results with correct answers', async () => {
    const { token, userId } = await signup();
    const { lesson } = await seed(userId);
    const quiz = await Quiz.create({ lessonId: lesson._id, userId, questions: mcqQuestions });

    const res = await request(app)
      .post(`/quizzes/${quiz._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionIndex: 0, answer: 'Paris' },
          { questionIndex: 1, answer: '3' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.submission.score).toBe(50);
    expect(res.body.submission.results[0].correct).toBe(true);
    expect(res.body.submission.results[1].correct).toBe(false);
    expect(res.body.submission.results[1].correctAnswer).toBe('4');
    expect(await QuizSubmission.countDocuments({ userId })).toBe(1);
  });

  it('401s without a token', async () => {
    const res = await request(app).post(`/quizzes/${new mongoose.Types.ObjectId()}/submit`).send({ answers: [] });
    expect(res.status).toBe(401);
  });

  it("404s submitting another user's quiz", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const { lesson } = await seed(a.userId);
    const quiz = await Quiz.create({ lessonId: lesson._id, userId: a.userId, questions: mcqQuestions });
    const res = await request(app)
      .post(`/quizzes/${quiz._id}/submit`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ answers: [] });
    expect(res.status).toBe(404);
  });

  it('grades short-answer through submitQuiz using the provided judge', async () => {
    const { userId } = await signup();
    const { lesson } = await seed(userId);
    const quiz = await Quiz.create({
      lessonId: lesson._id,
      userId,
      questions: [{ question: 'Explain X', type: 'short_answer', options: null, correctAnswer: 'ref' }],
    });
    const judge: ShortAnswerJudge = async () => ({ correct: true, feedback: 'Nice.' });
    const submission = await submitQuiz(userId, String(quiz._id), [{ questionIndex: 0, answer: 'stuff' }], judge);
    expect(submission.score).toBe(100);
    expect(submission.results[0].feedback).toBe('Nice.');
  });
});

describe('exam generation + submission', () => {
  it('generates a module-scoped exam', async () => {
    const { userId } = await signup();
    const { mod } = await seed(userId);
    const exam = await generateModuleExam(userId, String(mod._id), async () => ({
      questions: mcqQuestions as GeneratedQuestion[],
    }));
    expect(exam.scope).toBe('module');
    expect(String(exam.scopeId)).toBe(String(mod._id));
  });

  it('generates a course-scoped exam', async () => {
    const { userId } = await signup();
    const { course } = await seed(userId);
    const exam = await generateCourseExam(userId, String(course._id), async () => ({
      questions: mcqQuestions as GeneratedQuestion[],
    }));
    expect(exam.scope).toBe('course');
    expect(String(exam.scopeId)).toBe(String(course._id));
  });

  it('submits an exam and grades it', async () => {
    const { token, userId } = await signup();
    const { course } = await seed(userId);
    const exam = await Exam.create({ scope: 'course', scopeId: course._id, userId, questions: mcqQuestions });
    const res = await request(app)
      .post(`/exams/${exam._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionIndex: 0, answer: 'Paris' },
          { questionIndex: 1, answer: '4' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.submission.score).toBe(100);
    expect(await ExamSubmission.countDocuments({ userId })).toBe(1);
  });

  it('hides correct answers when fetching an exam', async () => {
    const { token, userId } = await signup();
    const { course } = await seed(userId);
    const exam = await Exam.create({ scope: 'course', scopeId: course._id, userId, questions: mcqQuestions });
    const res = await request(app).get(`/exams/${exam._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.body.exam.questions[0].correctAnswer).toBeUndefined();
  });

  it("404s generating an exam for another user's course or module", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const { course, mod } = await seed(a.userId);
    const rc = await request(app).post(`/courses/${course._id}/exam`).set('Authorization', `Bearer ${b.token}`);
    expect(rc.status).toBe(404);
    const rm = await request(app).post(`/modules/${mod._id}/exam`).set('Authorization', `Bearer ${b.token}`);
    expect(rm.status).toBe(404);
  });

  it("404s submitting another user's exam", async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const { course } = await seed(a.userId);
    const exam = await Exam.create({ scope: 'course', scopeId: course._id, userId: a.userId, questions: mcqQuestions });
    const res = await request(app)
      .post(`/exams/${exam._id}/submit`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ answers: [] });
    expect(res.status).toBe(404);
  });
});
