import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/modules/users/user.model';
import { Course } from '../src/modules/courses/course.model';
import { Module } from '../src/modules/modules-content/module.model';
import { Lesson } from '../src/modules/lessons/lesson.model';
import { seedProblems } from '../src/modules/problems/problem.service';
import { seedSimulations } from '../src/modules/simulations/simulation.service';
import { seedCuratedCourse } from '../src/modules/courses/curatedCourse.service';
import { CURATED_COURSE_SLUG } from '../src/modules/courses/curatedCourse.constants';
import { parseAuthCookies, cookieHeader } from './helpers/authCookies';

const TEST_DB = 'mongodb://127.0.0.1:27017/b2c_test_curated_course';

async function signup(email = 'learner@example.com') {
  const res = await request(app).post('/auth/signup').send({ email, password: 'supersecret1' });
  const cookies = parseAuthCookies(res);
  return { cookies, userId: res.body.user.id as string };
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
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('curated course POC', () => {
  it('seeds a 5-hour platform course with simulations and problem links', async () => {
    await seedProblems();
    await seedSimulations();
    const seeded = await seedCuratedCourse();

    expect(seeded.slug).toBe(CURATED_COURSE_SLUG);

    const course = await Course.findOne({ slug: CURATED_COURSE_SLUG }).lean();
    expect(course?.platformCurated).toBe(true);
    expect(course?.estimatedHours).toBe(5);

    const modules = await Module.find({ courseId: course?._id }).sort({ order: 1 });
    expect(modules).toHaveLength(4);

    const lessons = await Lesson.find({ courseId: course?._id }).sort({ order: 1 });
    expect(lessons).toHaveLength(12);

    const simulationLessons = lessons.filter(
      (lesson) =>
        lesson.content &&
        typeof lesson.content === 'object' &&
        (lesson.content as { activity?: { kind?: string } }).activity?.kind === 'simulation',
    );
    expect(simulationLessons).toHaveLength(4);

    const problemLessons = lessons.filter(
      (lesson) =>
        lesson.content &&
        typeof lesson.content === 'object' &&
        (lesson.content as { activity?: { kind?: string } }).activity?.kind === 'problems',
    );
    expect(problemLessons).toHaveLength(4);
  });

  it('lists curated course and grants learner access without enrollment', async () => {
    await seedProblems();
    await seedSimulations();
    await seedCuratedCourse();
    const { cookies } = await signup();
    const auth = cookieHeader(cookies);

    const publicList = await request(app).get('/guided-courses');
    expect(publicList.status).toBe(200);
    expect(publicList.body.courses[0].slug).toBe(CURATED_COURSE_SLUG);

    const publicDetail = await request(app).get(`/guided-courses/${CURATED_COURSE_SLUG}`);
    expect(publicDetail.status).toBe(200);
    expect(publicDetail.body.course.lessonCount).toBe(12);

    const list = await request(app).get('/courses/curated').set('Cookie', auth);
    expect(list.status).toBe(200);
    expect(list.body.courses[0].slug).toBe(CURATED_COURSE_SLUG);

    const detail = await request(app)
      .get(`/courses/curated/${CURATED_COURSE_SLUG}`)
      .set('Cookie', auth);
    expect(detail.status).toBe(200);
    expect(detail.body.course.lessonCount).toBe(12);

    const courseId = detail.body.course.id as string;
    const publicCourse = await request(app).get(`/guided-courses/id/${courseId}`);
    expect(publicCourse.status).toBe(200);
    expect(publicCourse.body.course.title).toBeTruthy();

    const structure = await request(app).get(`/guided-courses/id/${courseId}/structure`);
    expect(structure.status).toBe(200);
    expect(structure.body.modules).toHaveLength(4);

    const lessonId = structure.body.modules[0].lessons[0].id as string;
    const lesson = await request(app).get(`/guided-courses/lessons/${lessonId}`);
    expect(lesson.status).toBe(200);
    expect(lesson.body.lesson.title).toBeTruthy();

    const structureAuth = await request(app)
      .get(`/courses/${courseId}/structure`)
      .set('Cookie', auth);
    expect(structureAuth.status).toBe(200);
    expect(structureAuth.body.modules).toHaveLength(4);
  });

  it('re-seeds idempotently without duplicating courses', async () => {
    await seedProblems();
    await seedSimulations();
    await seedCuratedCourse();
    await seedCuratedCourse();

    const count = await Course.countDocuments({ slug: CURATED_COURSE_SLUG });
    expect(count).toBe(1);
    expect(await Lesson.countDocuments()).toBe(12);
  });
});
