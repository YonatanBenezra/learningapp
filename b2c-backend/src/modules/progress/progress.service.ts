import { Types } from 'mongoose';
import { UserLessonProgress } from './progress.model';

export async function listProgress(userId: string, courseId?: string) {
  const filter: Record<string, unknown> = { userId };
  if (courseId && Types.ObjectId.isValid(courseId)) filter.courseId = courseId;
  return UserLessonProgress.find(filter).sort({ updatedAt: -1 });
}
