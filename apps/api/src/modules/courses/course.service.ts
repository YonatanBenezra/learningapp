import { Types } from 'mongoose';
import { tierLimits, isUnlimitedLimit } from '../../config/tiers';
import { MIN_COURSE_TOPICS } from './course.constants';
import { Course } from './course.model';
import { Module } from '../modules-content/module.model';
import { Lesson } from '../lessons/lesson.model';
import { User } from '../users/user.model';
import { CourseEnrollment } from '../instructor/courseEnrollment.model';
import { AppError } from '../../common/errors/AppError';
import {
  requireAccessibleCourse,
  withUserCourseProgress,
} from './courseAccess.service';
import { logger } from '../../common/utils/logger';
import { courseGenerationQueue, jobPriority } from '../../jobs/queue';
import { generateCourseTree, type CourseTreeGenerator } from './course.generator';
import { generateLessonContent, type LessonContentGenerator } from './lesson.generator';
import { AiError } from '../ai-guidance/ai.error';
import { getCuratedCourseBySlug } from './curatedCourse.service';

function formatGenerationFailure(err: unknown): string {
  if (err instanceof AiError && err.message.includes('schema validation')) {
    logger.warn({ cause: err.cause }, 'Course generation schema validation failed');
    return 'We could not build your course from the AI response. Please try again.';
  }
  if (err instanceof Error) return err.message;
  return 'generation failed';
}

export interface CreateCourseInput {
  category: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  visualsPreferred?: boolean;
  dailyNotification?: boolean;
  aiModel?: string | null;
}

// Statuses that count against a user's "active course" quota.
const ACTIVE_STATUSES = ['generating', 'ready', 'completed'];

export async function createCourse(userId: string, input: CreateCourseInput) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const activeLimit = tierLimits(user.tier).activeCourses;
  const active = await Course.countDocuments({ userId, status: { $in: ACTIVE_STATUSES } });
  if (Number.isFinite(activeLimit) && active >= activeLimit) {
    throw new AppError(
      403,
      `${user.tier === 'free' ? 'Free' : user.tier === 'standard' ? 'Standard' : 'Your'} tier allows only ${activeLimit} active course${activeLimit === 1 ? '' : 's'}. Upgrade or archive one.`,
    );
  }

  const topicLimit = tierLimits(user.tier).topicsPerCourse;
  if (input.topics.length < MIN_COURSE_TOPICS) {
    throw new AppError(400, `Add at least ${MIN_COURSE_TOPICS} topics to create a course.`);
  }
  if (!isUnlimitedLimit(topicLimit) && input.topics.length > topicLimit) {
    throw new AppError(
      403,
      `${user.tier === 'free' ? 'Free' : 'Standard'} tier allows up to ${topicLimit} topics per course. Upgrade for more.`,
    );
  }

  const course = await Course.create({
    userId,
    title: 'Generating…',
    category: input.category,
    topics: input.topics,
    level: input.level,
    preferences: {
      visualsPreferred: input.visualsPreferred ?? false,
      dailyNotification: input.dailyNotification ?? false,
      aiModel: input.aiModel?.trim() || null,
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

  return course;
}

export async function getCourse(userId: string, courseId: string) {
  const course = await requireAccessibleCourse(userId, courseId);
  const json = course.toJSON() as Record<string, unknown>;
  return withUserCourseProgress(userId, json);
}

export async function listCourses(userId: string) {
  const owned = await Course.find({ userId }).sort({ createdAt: -1 });
  const enrollments = await CourseEnrollment.find({ studentId: userId, status: 'completed' })
    .sort({ purchasedAt: -1 })
    .select('courseId');

  const ownedIds = new Set(owned.map((course) => String(course._id)));
  const enrolledIds = enrollments
    .map((enrollment) => String(enrollment.courseId))
    .filter((id) => !ownedIds.has(id));

  const enrolled =
    enrolledIds.length > 0 ? await Course.find({ _id: { $in: enrolledIds } }) : [];

  const enrolledById = new Map(enrolled.map((course) => [String(course._id), course]));
  const orderedEnrolled = enrolledIds
    .map((id) => enrolledById.get(id))
    .filter((course): course is NonNullable<typeof course> => Boolean(course));

  const curated = await Course.find({
    platformCurated: true,
    isPublished: true,
    status: 'ready',
  }).sort({ createdAt: 1 });

  const combinedIds = new Set<string>();
  const combined: typeof owned = [];
  for (const course of [...curated, ...owned, ...orderedEnrolled]) {
    const id = String(course._id);
    if (combinedIds.has(id)) continue;
    combinedIds.add(id);
    combined.push(course);
  }

  return Promise.all(
    combined.map(async (course) => {
      const json = course.toJSON() as Record<string, unknown>;
      return withUserCourseProgress(userId, json);
    }),
  );
}

// Full Course -> Module -> Lesson tree for React Flow (§1.4). Ordered.
export async function getStructure(userId: string, courseId: string) {
  const course = await requireAccessibleCourse(userId, courseId);

  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
  const tree = await Promise.all(
    modules.map(async (m) => {
      const lessons = await Lesson.find({ moduleId: m._id }).sort({ order: 1 });
      return {
        id: String(m._id),
        title: m.title,
        domain: m.domain,
        order: m.order,
        lessonCount: lessons.length,
        lessons: lessons.map((l) => ({ id: String(l._id), title: l.title, order: l.order })),
      };
    }),
  );

  return {
    course: {
      id: String(course._id),
      title: course.title,
      status: course.status,
      category: course.category,
      level: course.level,
    },
    modules: tree,
  };
}

export async function getCuratedCoursePublic(slug: string) {
  const course = await getCuratedCourseBySlug(slug);
  if (!course) throw new AppError(404, 'Curated course not found');
  return course;
}

async function requireCuratedCourse(courseId: string) {
  if (!Types.ObjectId.isValid(courseId)) throw new AppError(404, 'Course not found');
  const course = await Course.findOne({
    _id: courseId,
    platformCurated: true,
    isPublished: true,
    status: 'ready',
  });
  if (!course) throw new AppError(404, 'Course not found');
  return course;
}

export async function getCuratedCoursePublicById(courseId: string, userId?: string) {
  const course = await requireCuratedCourse(courseId);
  const json = course.toJSON() as Record<string, unknown>;
  if (userId) return withUserCourseProgress(userId, json);
  return { ...json, progressPercent: 0, status: 'ready' };
}

export async function getCuratedStructurePublic(courseId: string) {
  const course = await requireCuratedCourse(courseId);

  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
  const tree = await Promise.all(
    modules.map(async (m) => {
      const lessons = await Lesson.find({ moduleId: m._id }).sort({ order: 1 });
      return {
        id: String(m._id),
        title: m.title,
        domain: m.domain,
        order: m.order,
        lessonCount: lessons.length,
        lessons: lessons.map((l) => ({ id: String(l._id), title: l.title, order: l.order })),
      };
    }),
  );

  return {
    course: {
      id: String(course._id),
      title: course.title,
      status: course.status,
      category: course.category,
      level: course.level,
    },
    modules: tree,
  };
}

// Worker logic (§8): generate the tree, persist it, and transition the course
// status. Idempotent — a non-generating course is left untouched. The generator
// is injectable so tests can drive this without hitting the AI provider.
export async function runCourseGeneration(
  courseId: string,
  generate: CourseTreeGenerator = generateCourseTree,
  generateContent: LessonContentGenerator = generateLessonContent,
): Promise<void> {
  const course = await Course.findById(courseId);
  if (!course || course.status !== 'generating') return;

  try {
    const prefs = course.preferences as {
      visualsPreferred?: boolean;
      aiModel?: string | null;
    } | undefined;
    const aiModel = prefs?.aiModel?.trim() || null;
    const tree = await generate({
      category: course.category as string,
      topics: course.topics as unknown as string[],
      level: course.level as 'beginner' | 'intermediate' | 'advanced',
      visualsPreferred: prefs?.visualsPreferred ?? false,
      userId: String(course.userId),
      aiModel,
    });

    const moduleIds: Types.ObjectId[] = [];
    for (let mi = 0; mi < tree.modules.length; mi += 1) {
      const m = tree.modules[mi];
      const mod = await Module.create({
        courseId: course._id,
        title: m.title,
        domain: m.domain,
        order: mi,
        lessonOrder: [],
      });

      const lessonIds: Types.ObjectId[] = [];
      for (let li = 0; li < m.lessons.length; li += 1) {
        const l = m.lessons[li];
        const content = await generateContent({
          courseTitle: tree.title,
          moduleTitle: m.title,
          lessonTitle: l.title,
          lessonSummary: l.summary,
          category: course.category as string,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          visualsPreferred: prefs?.visualsPreferred ?? false,
          userId: String(course.userId),
          aiModel,
        });
        const lesson = await Lesson.create({
          moduleId: mod._id,
          courseId: course._id,
          title: l.title,
          content,
          order: li,
        });
        lessonIds.push(lesson._id);
      }
      mod.set('lessonOrder', lessonIds);
      await mod.save();
      moduleIds.push(mod._id);
    }

    if (course.kind !== 'marketplace') {
      course.title = tree.title;
    }
    course.set('moduleOrder', moduleIds);
    course.status = 'ready';
    course.generatedAt = new Date();
    await course.save();
    logger.info({ courseId, modules: moduleIds.length }, 'Course generation succeeded');
  } catch (err) {
    course.status = 'failed';
    course.failureReason = formatGenerationFailure(err);
    await course.save();
    logger.error({ err, courseId }, 'Course generation failed');
  }
}
