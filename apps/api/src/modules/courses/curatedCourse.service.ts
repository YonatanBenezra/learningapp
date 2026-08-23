import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { Course } from './course.model';
import { Module } from '../modules-content/module.model';
import { Lesson } from '../lessons/lesson.model';
import { User } from '../users/user.model';
import { logger } from '../../common/utils/logger';
import {
  CURATED_COURSE_SLUG,
  PLATFORM_COURSE_OWNER_EMAIL,
  type CuratedLessonSeed,
} from './curatedCourse.constants';
import { CURATED_COURSE_META, CURATED_COURSE_MODULES } from './curatedCourse.content';

const SALT_ROUNDS = 10;

async function ensurePlatformOwner(): Promise<Types.ObjectId> {
  let user = await User.findOne({ email: PLATFORM_COURSE_OWNER_EMAIL });
  if (!user) {
    const passwordHash = await bcrypt.hash(`platform-${randomUUID()}`, SALT_ROUNDS);
    user = await User.create({
      email: PLATFORM_COURSE_OWNER_EMAIL,
      passwordHash,
      role: 'instructor',
      tier: 'premium',
      name: 'LabPath Platform',
    });
    logger.info({ email: PLATFORM_COURSE_OWNER_EMAIL }, 'Platform course owner created');
  }
  return user._id as Types.ObjectId;
}

function lessonContent(seed: CuratedLessonSeed) {
  const { content } = seed;
  return {
    summary: content.summary,
    sections: content.sections,
    keyPoints: content.keyPoints,
    estimatedMinutes: seed.estimatedMinutes,
    ...(content.activity ? { activity: content.activity } : {}),
  };
}

export async function seedCuratedCourse(): Promise<{ courseId: string; slug: string }> {
  const ownerId = await ensurePlatformOwner();

  let course = await Course.findOne({ slug: CURATED_COURSE_SLUG });
  if (course) {
    await Lesson.deleteMany({ courseId: course._id });
    await Module.deleteMany({ courseId: course._id });
  } else {
    course = await Course.create({
      userId: ownerId,
      title: CURATED_COURSE_META.title,
      category: CURATED_COURSE_META.category,
      topics: CURATED_COURSE_META.topics,
      level: CURATED_COURSE_META.level,
      description: CURATED_COURSE_META.description,
      kind: 'marketplace',
      slug: CURATED_COURSE_SLUG,
      platformCurated: true,
      estimatedHours: CURATED_COURSE_META.estimatedHours,
      priceCents: 0,
      currency: 'USD',
      isPublished: true,
      status: 'ready',
      moduleOrder: [],
      progressPercent: 0,
      generatedAt: new Date(),
    });
  }

  course.set({
    title: CURATED_COURSE_META.title,
    description: CURATED_COURSE_META.description,
    category: CURATED_COURSE_META.category,
    topics: CURATED_COURSE_META.topics,
    level: CURATED_COURSE_META.level,
    platformCurated: true,
    estimatedHours: CURATED_COURSE_META.estimatedHours,
    isPublished: true,
    status: 'ready',
    priceCents: 0,
    moduleOrder: [],
  });
  await course.save();

  const moduleIds: Types.ObjectId[] = [];

  for (let moduleIndex = 0; moduleIndex < CURATED_COURSE_MODULES.length; moduleIndex += 1) {
    const moduleSeed = CURATED_COURSE_MODULES[moduleIndex];
    const mod = await Module.create({
      courseId: course._id,
      title: moduleSeed.title,
      domain: moduleSeed.domain,
      order: moduleIndex,
      lessonOrder: [],
    });

    const lessonIds: Types.ObjectId[] = [];
    for (let lessonIndex = 0; lessonIndex < moduleSeed.lessons.length; lessonIndex += 1) {
      const lessonSeed = moduleSeed.lessons[lessonIndex];
      const lesson = await Lesson.create({
        moduleId: mod._id,
        courseId: course._id,
        title: lessonSeed.title,
        content: lessonContent(lessonSeed),
        order: lessonIndex,
      });
      lessonIds.push(lesson._id);
    }

    mod.set('lessonOrder', lessonIds);
    await mod.save();
    moduleIds.push(mod._id);
  }

  course.set('moduleOrder', moduleIds);
  await course.save();

  logger.info(
    {
      slug: CURATED_COURSE_SLUG,
      modules: moduleIds.length,
      lessons: CURATED_COURSE_MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0),
    },
    'Curated platform course seeded',
  );

  return { courseId: String(course._id), slug: CURATED_COURSE_SLUG };
}

export async function getCuratedCourseBySlug(slug: string) {
  const course = await Course.findOne({
    slug,
    platformCurated: true,
    isPublished: true,
    status: 'ready',
  }).lean();

  if (!course) return null;

  const lessonCount = await Lesson.countDocuments({ courseId: course._id });
  const moduleCount = await Module.countDocuments({ courseId: course._id });

  return {
    id: String(course._id),
    slug: course.slug as string,
    title: course.title as string,
    description: (course.description as string) ?? '',
    category: course.category as string,
    level: course.level as string,
    estimatedHours: (course.estimatedHours as number | null) ?? CURATED_COURSE_META.estimatedHours,
    topics: (course.topics as string[]) ?? [],
    lessonCount,
    moduleCount,
    simulationCount: 4,
    problemCount: 12,
  };
}

export async function listCuratedCourses() {
  const rows = await Course.find({
    platformCurated: true,
    isPublished: true,
    status: 'ready',
  })
    .sort({ createdAt: 1 })
    .lean();

  return Promise.all(
    rows.map(async (course) => {
      const lessonCount = await Lesson.countDocuments({ courseId: course._id });
      const moduleCount = await Module.countDocuments({ courseId: course._id });
      return {
        id: String(course._id),
        slug: course.slug as string,
        title: course.title as string,
        description: (course.description as string) ?? '',
        category: course.category as string,
        level: course.level as string,
        estimatedHours: (course.estimatedHours as number | null) ?? null,
        lessonCount,
        moduleCount,
      };
    }),
  );
}
