import { Types } from 'mongoose';
import { Course } from './course.model';
import { Module } from '../modules-content/module.model';
import { Lesson } from '../lessons/lesson.model';
import { User } from '../users/user.model';
import { AppError } from '../../common/errors/AppError';
import { logger } from '../../common/utils/logger';
import { courseGenerationQueue } from '../../jobs/queue';
import { generateCourseTree, type CourseTreeGenerator } from './course.generator';

export interface CreateCourseInput {
  category: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  visualsPreferred?: boolean;
  dailyNotification?: boolean;
}

// Statuses that count against a user's "active course" quota.
const ACTIVE_STATUSES = ['generating', 'ready', 'completed'];

export async function createCourse(userId: string, input: CreateCourseInput) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  // Free tier: 1 active course (full entitlement handling lands in Phase 8).
  if (user.tier === 'free') {
    const active = await Course.countDocuments({ userId, status: { $in: ACTIVE_STATUSES } });
    if (active >= 1) {
      throw new AppError(403, 'Free tier allows only 1 active course. Upgrade or archive one.');
    }
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
    },
    status: 'generating',
    moduleOrder: [],
    progressPercent: 0,
  });

  await courseGenerationQueue().add('generate', { courseId: String(course._id) });
  return course;
}

export async function getCourse(userId: string, courseId: string) {
  const course = await Course.findOne({ _id: courseId, userId });
  if (!course) throw new AppError(404, 'Course not found');
  return course;
}

export async function listCourses(userId: string) {
  return Course.find({ userId }).sort({ createdAt: -1 });
}

// Full Course -> Module -> Lesson tree for React Flow (§1.4). Ordered.
export async function getStructure(userId: string, courseId: string) {
  const course = await Course.findOne({ _id: courseId, userId });
  if (!course) throw new AppError(404, 'Course not found');

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
): Promise<void> {
  const course = await Course.findById(courseId);
  if (!course || course.status !== 'generating') return;

  try {
    const prefs = course.preferences as { visualsPreferred?: boolean } | undefined;
    const tree = await generate({
      category: course.category as string,
      topics: course.topics as unknown as string[],
      level: course.level as 'beginner' | 'intermediate' | 'advanced',
      visualsPreferred: prefs?.visualsPreferred ?? false,
      userId: String(course.userId),
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
        const lesson = await Lesson.create({
          moduleId: mod._id,
          courseId: course._id,
          title: l.title,
          content: { summary: l.summary },
          order: li,
        });
        lessonIds.push(lesson._id);
      }
      mod.set('lessonOrder', lessonIds);
      await mod.save();
      moduleIds.push(mod._id);
    }

    course.title = tree.title;
    course.set('moduleOrder', moduleIds);
    course.status = 'ready';
    course.generatedAt = new Date();
    await course.save();
    logger.info({ courseId, modules: moduleIds.length }, 'Course generation succeeded');
  } catch (err) {
    course.status = 'failed';
    course.failureReason = err instanceof Error ? err.message : 'generation failed';
    await course.save();
    logger.error({ err, courseId }, 'Course generation failed');
  }
}
