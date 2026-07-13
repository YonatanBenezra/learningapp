import { Types } from 'mongoose';
import { Lesson } from './lesson.model';
import { Course } from '../courses/course.model';
import { User } from '../users/user.model';
import { UserLessonProgress } from '../progress/progress.model';
import { AppError } from '../../common/errors/AppError';

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

// Resolves a lesson the user actually owns (lesson -> course -> userId), else 404.
export async function resolveOwnedLesson(userId: string, lessonId: string) {
  if (!Types.ObjectId.isValid(lessonId)) throw new AppError(404, 'Lesson not found');
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(404, 'Lesson not found');
  const course = await Course.findOne({ _id: lesson.courseId, userId });
  if (!course) throw new AppError(404, 'Lesson not found');
  return { lesson, course };
}

export async function getLesson(userId: string, lessonId: string) {
  const { lesson } = await resolveOwnedLesson(userId, lessonId);
  const progress = await UserLessonProgress.findOne({ userId, lessonId });
  return { lesson, progress };
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
  course.progressPercent = progressPercent;
  if (progressPercent >= 100 && course.status === 'ready') course.status = 'completed';
  await course.save();

  return { progress, streak, course: { progressPercent, status: course.status } };
}
