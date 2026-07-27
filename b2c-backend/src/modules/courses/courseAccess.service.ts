import { Types } from 'mongoose';
import { Course } from './course.model';
import { CourseEnrollment } from '../instructor/courseEnrollment.model';
import { Lesson } from '../lessons/lesson.model';
import { UserLessonProgress } from '../progress/progress.model';
import { AppError } from '../../common/errors/AppError';

export async function findAccessibleCourse(userId: string, courseId: string) {
  if (!Types.ObjectId.isValid(courseId)) return null;

  const course = await Course.findById(courseId);
  if (!course) return null;

  if (String(course.userId) === userId) return course;

  const enrolled = await CourseEnrollment.exists({
    courseId: course._id,
    studentId: userId,
    status: 'completed',
  });

  return enrolled ? course : null;
}

export async function requireAccessibleCourse(userId: string, courseId: string) {
  const course = await findAccessibleCourse(userId, courseId);
  if (!course) throw new AppError(404, 'Course not found');
  return course;
}

export function isCourseOwner(course: { userId?: unknown }, userId: string): boolean {
  return String(course.userId) === userId;
}

export async function computeUserCourseProgress(
  userId: string,
  courseId: Types.ObjectId | string,
): Promise<number> {
  const total = await Lesson.countDocuments({ courseId });
  if (total === 0) return 0;

  const done = await UserLessonProgress.countDocuments({
    userId,
    courseId,
    status: 'completed',
  });

  return Math.round((done / total) * 100);
}

export async function withUserCourseProgress<
  T extends {
    progressPercent?: number;
    status?: string;
    kind?: string;
    userId?: unknown;
    _id?: unknown;
  },
>(userId: string, course: T): Promise<T> {
  if (course.kind === 'marketplace' && !isCourseOwner(course, userId)) {
    const progressPercent = await computeUserCourseProgress(userId, course._id as Types.ObjectId);
    const status =
      progressPercent >= 100
        ? 'completed'
        : course.status === 'generating' || course.status === 'failed'
          ? course.status
          : 'ready';
    return { ...course, progressPercent, status };
  }

  return course;
}
