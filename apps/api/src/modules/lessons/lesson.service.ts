import { Types } from 'mongoose';
import { Lesson } from './lesson.model';
import { User } from '../users/user.model';
import { UserLessonProgress } from '../progress/progress.model';
import { safeAward } from '../gamification/gamification.service';
import { AppError } from '../../common/errors/AppError';
import { findAccessibleCourse, isCourseOwner } from '../courses/courseAccess.service';

// Pure daily-streak transition (calendar-day based, UTC). Exported for tests.
export function nextStreak(
  current: number,
  lastActivityDate: Date | null | undefined,
  now: Date,
): number {
  if (!lastActivityDate) return 1;
  const dayMs = 86_400_000;
  const utcDay = (d: Date): number => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.round((utcDay(now) - utcDay(lastActivityDate)) / dayMs);
  if (diff <= 0) return current > 0 ? current : 1; // same day (or clock skew) — unchanged
  if (diff === 1) return current + 1; // consecutive day — bump
  return 1; // gap — reset
}

// Resolves a lesson the user can access (owned course or marketplace enrollment).
export async function resolveOwnedLesson(userId: string, lessonId: string) {
  if (!Types.ObjectId.isValid(lessonId)) throw new AppError(404, 'Lesson not found');
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(404, 'Lesson not found');
  const course = await findAccessibleCourse(userId, String(lesson.courseId));
  if (!course) throw new AppError(404, 'Lesson not found');
  return { lesson, course };
}

export async function getLesson(userId: string, lessonId: string) {
  const { lesson, course } = await resolveOwnedLesson(userId, lessonId);
  const [progress, user] = await Promise.all([
    UserLessonProgress.findOne({ userId, lessonId }),
    User.findById(userId).select('role').lean(),
  ]);

  const role = user?.role as string | undefined;
  const canEditContent =
    (role === 'instructor' || role === 'admin') &&
    course.kind === 'marketplace' &&
    course.status !== 'generating';

  return {
    lesson,
    progress,
    canEditContent,
    instructorCourseId: canEditContent ? String(course._id) : null,
  };
}

export async function startLesson(userId: string, lessonId: string) {
  const { lesson } = await resolveOwnedLesson(userId, lessonId);
  const existing = await UserLessonProgress.findOne({ userId, lessonId });
  if (existing?.status === 'completed') return existing; // never downgrade a completed lesson
  return UserLessonProgress.findOneAndUpdate(
    { userId, lessonId },
    { $set: { status: 'in_progress', courseId: lesson.courseId } },
    { new: true, upsert: true },
  );
}

export async function completeLesson(userId: string, lessonId: string, now: Date = new Date()) {
  const { lesson, course } = await resolveOwnedLesson(userId, lessonId);

  const progress = await UserLessonProgress.findOneAndUpdate(
    { userId, lessonId },
    { $set: { status: 'completed', completedAt: now, courseId: lesson.courseId } },
    { new: true, upsert: true },
  );

  // Daily streak — bumps at most once per calendar day of activity.
  let streak: { current: number; lastActivityDate: Date } | null = null;
  const user = await User.findById(userId);
  if (user) {
    const s = user.streak as { current?: number; lastActivityDate?: Date } | undefined;
    const current = nextStreak(s?.current ?? 0, s?.lastActivityDate ?? null, now);
    user.set('streak', { current, lastActivityDate: now });
    await user.save();
    streak = { current, lastActivityDate: now };
  }

  // Recompute course progress %; mark completed at 100%.
  const total = await Lesson.countDocuments({ courseId: course._id });
  const done = await UserLessonProgress.countDocuments({
    userId,
    courseId: course._id,
    status: 'completed',
  });
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const owner = isCourseOwner(course, userId);
  let courseStatus = course.status;

  if (owner || course.kind !== 'marketplace') {
    course.progressPercent = progressPercent;
    if (progressPercent >= 100 && course.status === 'ready') course.status = 'completed';
    courseStatus = course.status;
    await course.save();
  } else {
    courseStatus = progressPercent >= 100 ? 'completed' : 'ready';
  }

  // Gamification (§3): award lesson / streak / course-completion achievements.
  // Non-fatal — a gamification failure must never break lesson completion.
  const totalCompleted = await UserLessonProgress.countDocuments({
    userId,
    status: 'completed',
  });
  const achievements = await safeAward(userId, {
    lessonsCompleted: totalCompleted,
    streak: streak?.current,
    courseCompleted: progressPercent >= 100,
  });

  return { progress, streak, course: { progressPercent, status: courseStatus }, achievements };
}
