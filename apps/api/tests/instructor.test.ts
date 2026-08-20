import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { Course } from '../src/modules/courses/course.model';
import { Module } from '../src/modules/modules-content/module.model';
import { Lesson } from '../src/modules/lessons/lesson.model';
import { CourseEnrollment } from '../src/modules/instructor/courseEnrollment.model';
import { parseAuthCookies, cookieHeader } from './helpers/authCookies';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_instructor';

async function signupInstructor(email = 'instructor@example.com') {
  const signup = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  const userId = signup.body.user.id as string;
  await User.updateOne({ _id: userId }, { role: 'instructor' });
  const login = await request(app).post('/auth/login').send({ email, password: 'supersecret1' });
  const cookies = parseAuthCookies(login);
  return { cookies: cookieHeader(cookies), userId };
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Lesson.deleteMany({}),
    CourseEnrollment.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

async function createReadyCourse(userId: string) {
  const course = await Course.create({
    userId,
    kind: 'marketplace',
    title: 'Structure course',
    description: 'Desc',
    category: 'Machine Learning',
    topics: ['dart'],
    level: 'advanced',
    status: 'ready',
    moduleOrder: [],
    progressPercent: 0,
  });

  const moduleA = await Module.create({
    courseId: course._id,
    title: 'Module A',
    domain: 'programming',
    order: 0,
    lessonOrder: [],
  });
  const moduleB = await Module.create({
    courseId: course._id,
    title: 'Module B',
    domain: 'programming',
    order: 1,
    lessonOrder: [],
  });

  const lessonA1 = await Lesson.create({
    courseId: course._id,
    moduleId: moduleA._id,
    title: 'Lesson A1',
    content: { summary: 's' },
    order: 0,
  });
  const lessonA2 = await Lesson.create({
    courseId: course._id,
    moduleId: moduleA._id,
    title: 'Lesson A2',
    content: { summary: 's' },
    order: 1,
  });
  const lessonB1 = await Lesson.create({
    courseId: course._id,
    moduleId: moduleB._id,
    title: 'Lesson B1',
    content: { summary: 's' },
    order: 0,
  });

  moduleA.set('lessonOrder', [lessonA1._id, lessonA2._id]);
  moduleB.set('lessonOrder', [lessonB1._id]);
  await moduleA.save();
  await moduleB.save();
  course.set('moduleOrder', [moduleA._id, moduleB._id]);
  await course.save();

  return {
    course,
    moduleA,
    moduleB,
    lessonA1,
    lessonA2,
    lessonB1,
  };
}

describe.sequential('instructor course structure', () => {
  it('updates module and lesson titles', async () => {
    const { cookies, userId } = await signupInstructor('structure-edit@example.com');
    const { course, moduleA, lessonA1 } = await createReadyCourse(userId);

    const moduleRes = await request(app)
      .patch(`/instructor/courses/${course._id}/modules/${moduleA._id}`)
      .set('Cookie', cookies)
      .send({ title: 'Updated module' });

    expect(moduleRes.status).toBe(200);
    expect(moduleRes.body.module.title).toBe('Updated module');

    const lessonRes = await request(app)
      .patch(`/instructor/courses/${course._id}/lessons/${lessonA1._id}`)
      .set('Cookie', cookies)
      .send({ title: 'Updated lesson' });

    expect(lessonRes.status).toBe(200);
    expect(lessonRes.body.lesson.title).toBe('Updated lesson');
  });

  it('deletes a lesson and renumbers remaining lessons', async () => {
    const { cookies, userId } = await signupInstructor('structure-delete-lesson@example.com');
    const { course, moduleA, lessonA1, lessonA2 } = await createReadyCourse(userId);

    const res = await request(app)
      .delete(`/instructor/courses/${course._id}/lessons/${lessonA1._id}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(await Lesson.countDocuments({ _id: lessonA1._id })).toBe(0);

    const remaining = await Lesson.find({ moduleId: moduleA._id }).sort({ order: 1 });
    expect(remaining).toHaveLength(1);
    expect(String(remaining[0]._id)).toBe(String(lessonA2._id));
    expect(remaining[0].order).toBe(0);
  });

  it('deletes a module and its lessons', async () => {
    const { cookies, userId } = await signupInstructor('structure-delete-module@example.com');
    const { course, moduleA, lessonA1, lessonA2 } = await createReadyCourse(userId);

    const res = await request(app)
      .delete(`/instructor/courses/${course._id}/modules/${moduleA._id}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(await Module.countDocuments({ _id: moduleA._id })).toBe(0);
    expect(await Lesson.countDocuments({ moduleId: moduleA._id })).toBe(0);
    expect(await Lesson.countDocuments({ _id: { $in: [lessonA1._id, lessonA2._id] } })).toBe(0);
  });

  it('reorders modules and lessons', async () => {
    const { cookies, userId } = await signupInstructor('structure-reorder@example.com');
    const { course, moduleA, moduleB, lessonA1, lessonA2, lessonB1 } = await createReadyCourse(userId);

    const res = await request(app)
      .patch(`/instructor/courses/${course._id}/structure/order`)
      .set('Cookie', cookies)
      .send({
        moduleOrder: [String(moduleB._id), String(moduleA._id)],
        lessonsByModule: {
          [String(moduleB._id)]: [String(lessonB1._id)],
          [String(moduleA._id)]: [String(lessonA2._id), String(lessonA1._id)],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reordered: true });

    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
    expect(String(modules[0]._id)).toBe(String(moduleB._id));
    expect(String(modules[1]._id)).toBe(String(moduleA._id));

    const lessonsA = await Lesson.find({ moduleId: moduleA._id }).sort({ order: 1 });
    expect(lessonsA.map((lesson) => String(lesson._id))).toEqual([
      String(lessonA2._id),
      String(lessonA1._id),
    ]);
  });

  it('updates lesson content', async () => {
    const { cookies, userId } = await signupInstructor('structure-content@example.com');
    const { course, lessonA1 } = await createReadyCourse(userId);

    const res = await request(app)
      .patch(`/instructor/courses/${course._id}/lessons/${lessonA1._id}/content`)
      .set('Cookie', cookies)
      .send({
        title: 'Updated lesson title',
        content: {
          summary: 'Updated overview for the lesson.',
          sections: [{ title: 'Core ideas', body: 'Updated lesson body content.' }],
          keyPoints: ['Point one', 'Point two'],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.lesson.title).toBe('Updated lesson title');
    expect(res.body.lesson.content.summary).toBe('Updated overview for the lesson.');
  });

  it('blocks structure edits while generating', async () => {
    const { cookies, userId } = await signupInstructor('structure-generating@example.com');
    const course = await Course.create({
      userId,
      kind: 'marketplace',
      title: 'Generating course',
      description: 'Desc',
      category: 'Machine Learning',
      topics: ['dart'],
      level: 'advanced',
      status: 'generating',
      moduleOrder: [],
      progressPercent: 0,
    });
    const moduleDoc = await Module.create({
      courseId: course._id,
      title: 'Module',
      domain: 'programming',
      order: 0,
      lessonOrder: [],
    });

    const res = await request(app)
      .patch(`/instructor/courses/${course._id}/modules/${moduleDoc._id}`)
      .set('Cookie', cookies)
      .send({ title: 'New title' });

    expect(res.status).toBe(409);
  });
});

describe('DELETE /instructor/courses/:id', () => {
  it('deletes an instructor marketplace course', async () => {
    const { cookies, userId } = await signupInstructor();

    const course = await Course.create({
      userId,
      kind: 'marketplace',
      title: 'Test course',
      description: 'Desc',
      category: 'Artificial Intelligence',
      topics: ['test'],
      level: 'beginner',
      status: 'ready',
      moduleOrder: [],
      progressPercent: 0,
    });

    await Module.create({
      courseId: course._id,
      title: 'Module 1',
      domain: 'general',
      order: 0,
      lessonOrder: [],
    });

    const res = await request(app)
      .delete(`/instructor/courses/${course._id}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect(await Course.countDocuments({ _id: course._id })).toBe(0);
    expect(await Module.countDocuments({ courseId: course._id })).toBe(0);
  });

  it('rejects learners without instructor role', async () => {
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email: 'learner@example.com', password: 'supersecret1' });
    const cookies = cookieHeader(parseAuthCookies(signup));
    const userId = signup.body.user.id as string;

    const course = await Course.create({
      userId,
      kind: 'marketplace',
      title: 'Test course',
      description: 'Desc',
      category: 'Artificial Intelligence',
      topics: ['test'],
      level: 'beginner',
      status: 'ready',
      moduleOrder: [],
      progressPercent: 0,
    });

    const deleteRes = await request(app)
      .delete(`/instructor/courses/${course._id}`)
      .set('Cookie', cookies);

    expect(deleteRes.status).toBe(403);
  });
});

describe('marketplace enrollment', () => {
  it('lists purchased marketplace courses on GET /courses for the student', async () => {
    const instructor = await signupInstructor('seller@example.com');
    const course = await Course.create({
      userId: instructor.userId,
      kind: 'marketplace',
      title: 'Published marketplace course',
      description: 'Desc',
      category: 'Machine Learning',
      topics: ['react'],
      level: 'beginner',
      status: 'ready',
      isPublished: true,
      priceCents: 4900,
      currency: 'USD',
      moduleOrder: [],
      progressPercent: 0,
    });

    const studentSignup = await request(app)
      .post('/auth/signup')
      .send({ email: 'buyer@example.com', password: 'supersecret1', name: 'Buyer' });
    const studentCookies = cookieHeader(parseAuthCookies(studentSignup));

    const purchase = await request(app)
      .post(`/marketplace/courses/${course._id}/purchase`)
      .set('Cookie', studentCookies);

    expect(purchase.status).toBe(201);

    const list = await request(app).get('/courses').set('Cookie', studentCookies);
    expect(list.status).toBe(200);
    expect(list.body.courses.some((item: { id: string }) => item.id === String(course._id))).toBe(
      true,
    );
  });
});
