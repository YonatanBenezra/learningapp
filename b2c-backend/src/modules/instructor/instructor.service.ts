import { Types } from 'mongoose';
import { Course } from '../courses/course.model';
import { Module } from '../modules-content/module.model';
import { Lesson } from '../lessons/lesson.model';
import { User } from '../users/user.model';
import { AppError } from '../../common/errors/AppError';
import { courseGenerationQueue, jobPriority } from '../../jobs/queue';
import { CourseEnrollment } from './courseEnrollment.model';

export interface CreateInstructorCourseInput {
  title: string;
  description: string;
  category: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  priceCents: number;
  currency?: string;
  visualsPreferred?: boolean;
  dailyNotification?: boolean;
}

export interface UpdateInstructorCourseInput {
  title?: string;
  description?: string;
  category?: string;
  topics?: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
  priceCents?: number;
  currency?: string;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'course'
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 0;
  while (await Course.findOne({ slug }).select('_id').lean()) {
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
  return slug;
}

function mapCourse(doc: Record<string, unknown>) {
  return {
    id: String(doc.id ?? doc._id),
    title: doc.title as string,
    description: (doc.description as string) ?? '',
    category: doc.category as string,
    topics: (doc.topics as string[]) ?? [],
    level: doc.level as string,
    status: doc.status as string,
    priceCents: (doc.priceCents as number) ?? 0,
    currency: (doc.currency as string) ?? 'USD',
    isPublished: Boolean(doc.isPublished),
    slug: (doc.slug as string) ?? null,
    enrollmentCount: (doc.enrollmentCount as number) ?? 0,
    revenueCents: (doc.revenueCents as number) ?? 0,
    progressPercent: (doc.progressPercent as number) ?? 0,
    failureReason: (doc.failureReason as string) ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapSale(doc: Record<string, unknown>) {
  return {
    id: String(doc.id ?? doc._id),
    courseId: String(doc.courseId),
    studentId: String(doc.studentId),
    studentEmail: doc.studentEmail as string,
    amountCents: doc.amountCents as number,
    currency: (doc.currency as string) ?? 'USD',
    status: doc.status as string,
    purchasedAt: doc.purchasedAt,
  };
}

export async function getDashboard(instructorId: string) {
  const instructorObjectId = new Types.ObjectId(instructorId);
  const [courses, publishedCourses, salesAgg, recentSalesDocs] = await Promise.all([
    Course.countDocuments({ userId: instructorObjectId, kind: 'marketplace' }),
    Course.countDocuments({ userId: instructorObjectId, kind: 'marketplace', isPublished: true }),
    CourseEnrollment.aggregate([
      { $match: { instructorId: instructorObjectId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenueCents: { $sum: '$amountCents' },
        },
      },
    ]),
    CourseEnrollment.find({ instructorId: instructorObjectId })
      .sort({ purchasedAt: -1 })
      .limit(8)
      .lean(),
  ]);

  const courseIds = [...new Set(recentSalesDocs.map((s) => String(s.courseId)))];
  const courseTitles = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } })
        .select('title')
        .lean()
    : [];
  const titleById = new Map(courseTitles.map((c) => [String(c._id), c.title as string]));

  const agg = salesAgg[0] ?? { totalSales: 0, totalRevenueCents: 0 };

  return {
    stats: {
      totalCourses: courses,
      publishedCourses,
      totalSales: agg.totalSales ?? 0,
      totalRevenueCents: agg.totalRevenueCents ?? 0,
    },
    recentSales: recentSalesDocs.map((sale) => ({
      ...mapSale(sale as unknown as Record<string, unknown>),
      courseTitle: titleById.get(String(sale.courseId)) ?? 'Course',
    })),
  };
}

export async function listInstructorCourses(instructorId: string) {
  const docs = await Course.find({ userId: instructorId, kind: 'marketplace' })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => mapCourse(doc as unknown as Record<string, unknown>));
}

export async function getInstructorCourse(instructorId: string, courseId: string) {
  const doc = await Course.findOne({ _id: courseId, userId: instructorId, kind: 'marketplace' }).lean();
  if (!doc) throw new AppError(404, 'Course not found');
  return mapCourse(doc as unknown as Record<string, unknown>);
}

export async function createInstructorCourse(instructorId: string, input: CreateInstructorCourseInput) {
  const user = await User.findById(instructorId);
  if (!user) throw new AppError(404, 'User not found');

  const course = await Course.create({
    userId: instructorId,
    kind: 'marketplace',
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    topics: input.topics,
    level: input.level,
    priceCents: input.priceCents,
    currency: input.currency ?? 'USD',
    isPublished: false,
    preferences: {
      visualsPreferred: input.visualsPreferred ?? false,
      dailyNotification: input.dailyNotification ?? false,
    },
    status: 'generating',
    moduleOrder: [],
    progressPercent: 0,
  });

  await courseGenerationQueue().add(
    'generate',
    { courseId: String(course._id) },
    { priority: jobPriority(user.tier as string) },
  );

  return mapCourse(course.toJSON() as Record<string, unknown>);
}

export async function updateInstructorCourse(
  instructorId: string,
  courseId: string,
  input: UpdateInstructorCourseInput,
) {
  const course = await Course.findOne({ _id: courseId, userId: instructorId, kind: 'marketplace' });
  if (!course) throw new AppError(404, 'Course not found');

  if (input.title !== undefined) course.title = input.title.trim();
  if (input.description !== undefined) course.description = input.description.trim();
  if (input.category !== undefined) course.category = input.category;
  if (input.topics !== undefined) course.topics = input.topics;
  if (input.level !== undefined) course.level = input.level;
  if (input.priceCents !== undefined) course.priceCents = input.priceCents;
  if (input.currency !== undefined) course.currency = input.currency;

  await course.save();
  return mapCourse(course.toJSON() as Record<string, unknown>);
}

export async function publishInstructorCourse(instructorId: string, courseId: string) {
  const course = await Course.findOne({ _id: courseId, userId: instructorId, kind: 'marketplace' });
  if (!course) throw new AppError(404, 'Course not found');
  if (course.status !== 'ready') {
    throw new AppError(400, 'Course must finish generating before it can be published.');
  }
  const priceCents = Number(course.priceCents ?? 0);
  if (priceCents <= 0) {
    throw new AppError(400, 'Set a price greater than zero before publishing.');
  }

  course.isPublished = true;
  if (!course.slug) {
    course.slug = await uniqueSlug(course.title as string);
  }
  await course.save();
  return mapCourse(course.toJSON() as Record<string, unknown>);
}

export async function unpublishInstructorCourse(instructorId: string, courseId: string) {
  const course = await Course.findOne({ _id: courseId, userId: instructorId, kind: 'marketplace' });
  if (!course) throw new AppError(404, 'Course not found');
  course.isPublished = false;
  await course.save();
  return mapCourse(course.toJSON() as Record<string, unknown>);
}

export async function deleteInstructorCourse(instructorId: string, courseId: string) {
  const course = await Course.findOne({ _id: courseId, userId: instructorId, kind: 'marketplace' });
  if (!course) throw new AppError(404, 'Course not found');

  const enrollmentCount = await CourseEnrollment.countDocuments({ courseId: course._id });
  if (enrollmentCount > 0) {
    throw new AppError(400, 'Cannot delete a course that has sales. Unpublish it instead.');
  }

  await Promise.all([
    Module.deleteMany({ courseId: course._id }),
    Lesson.deleteMany({ courseId: course._id }),
  ]);
  await course.deleteOne();
  return { deleted: true as const };
}

export async function listSales(instructorId: string) {
  const sales = await CourseEnrollment.find({ instructorId })
    .sort({ purchasedAt: -1 })
    .lean();
  const courseIds = [...new Set(sales.map((s) => String(s.courseId)))];
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } })
        .select('title')
        .lean()
    : [];
  const titleById = new Map(courses.map((c) => [String(c._id), c.title as string]));

  return sales.map((sale) => ({
    ...mapSale(sale as unknown as Record<string, unknown>),
    courseTitle: titleById.get(String(sale.courseId)) ?? 'Course',
  }));
}

export async function recordCoursePurchase(courseId: string, studentId: string) {
  const course = await Course.findOne({
    _id: courseId,
    kind: 'marketplace',
    isPublished: true,
    status: 'ready',
  });
  if (!course) throw new AppError(404, 'Published course not found');

  if (String(course.userId) === studentId) {
    throw new AppError(400, 'You cannot purchase your own course.');
  }

  const existing = await CourseEnrollment.findOne({ courseId: course._id, studentId });
  if (existing) throw new AppError(409, 'You are already enrolled in this course.');

  const student = await User.findById(studentId);
  if (!student) throw new AppError(404, 'User not found');

  const amountCents = course.priceCents as number;
  const enrollment = await CourseEnrollment.create({
    instructorId: course.userId,
    courseId: course._id,
    studentId,
    studentEmail: student.email,
    amountCents,
    currency: course.currency ?? 'USD',
    status: 'completed',
    purchasedAt: new Date(),
  });

  await Course.updateOne(
    { _id: course._id },
    { $inc: { enrollmentCount: 1, revenueCents: amountCents } },
  );

  return mapSale(enrollment.toJSON() as Record<string, unknown>);
}

export async function listPublishedCourses() {
  const docs = await Course.find({
    kind: 'marketplace',
    isPublished: true,
    status: 'ready',
  })
    .sort({ createdAt: -1 })
    .select('title description category level priceCents currency slug enrollmentCount userId')
    .lean();

  const courseIds = docs.map((doc) => doc._id);
  const lessonCounts =
    courseIds.length > 0
      ? await Lesson.aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { courseId: { $in: courseIds } } },
          { $group: { _id: '$courseId', count: { $sum: 1 } } },
        ])
      : [];
  const lessonCountByCourse = new Map(
    lessonCounts.map((row) => [String(row._id), row.count]),
  );

  const instructorIds = [...new Set(docs.map((d) => String(d.userId)))];
  const instructors = instructorIds.length
    ? await User.find({ _id: { $in: instructorIds } })
        .select('email name')
        .lean()
    : [];
  const instructorById = new Map(
    instructors.map((u) => [
      String(u._id),
      { email: u.email as string, name: (u.name as string) ?? '' },
    ]),
  );

  return docs.map((doc) => {
    const instructor = instructorById.get(String(doc.userId));
    return {
      id: String(doc._id),
      title: doc.title as string,
      description: (doc.description as string) ?? '',
      category: doc.category as string,
      level: doc.level as string,
      priceCents: (doc.priceCents as number) ?? 0,
      currency: (doc.currency as string) ?? 'USD',
      slug: (doc.slug as string) ?? null,
      enrollmentCount: (doc.enrollmentCount as number) ?? 0,
      lessonCount: lessonCountByCourse.get(String(doc._id)) ?? 0,
      instructorEmail: instructor?.email ?? '',
      instructorName: instructor?.name?.trim() ?? '',
    };
  });
}

export async function getPublishedCourse(courseId: string) {
  const doc = await Course.findOne({
    _id: courseId,
    kind: 'marketplace',
    isPublished: true,
    status: 'ready',
  }).lean();
  if (!doc) throw new AppError(404, 'Course not found');

  const [lessonCount, instructor, modules] = await Promise.all([
    Lesson.countDocuments({ courseId: doc._id }),
    User.findById(doc.userId).select('email name').lean(),
    Module.find({ courseId: doc._id }).sort({ order: 1 }).lean(),
  ]);

  const moduleIds = modules.map((moduleDoc) => moduleDoc._id);
  const lessons =
    moduleIds.length > 0
      ? await Lesson.find({ moduleId: { $in: moduleIds } })
          .sort({ order: 1 })
          .select('moduleId title order')
          .lean()
      : [];

  const lessonsByModule = new Map<string, { id: string; title: string; order: number }[]>();
  for (const lesson of lessons) {
    const key = String(lesson.moduleId);
    const bucket = lessonsByModule.get(key) ?? [];
    bucket.push({
      id: String(lesson._id),
      title: lesson.title as string,
      order: lesson.order as number,
    });
    lessonsByModule.set(key, bucket);
  }

  return {
    course: {
      id: String(doc._id),
      title: doc.title as string,
      description: (doc.description as string) ?? '',
      category: doc.category as string,
      level: doc.level as string,
      topics: (doc.topics as string[]) ?? [],
      priceCents: (doc.priceCents as number) ?? 0,
      currency: (doc.currency as string) ?? 'USD',
      slug: (doc.slug as string) ?? null,
      enrollmentCount: (doc.enrollmentCount as number) ?? 0,
      lessonCount,
      instructorEmail: (instructor?.email as string) ?? '',
      instructorName: ((instructor?.name as string) ?? '').trim(),
    },
    modules: modules.map((moduleDoc) => ({
      id: String(moduleDoc._id),
      title: moduleDoc.title as string,
      domain: moduleDoc.domain as string,
      order: moduleDoc.order as number,
      lessons: lessonsByModule.get(String(moduleDoc._id)) ?? [],
    })),
  };
}
