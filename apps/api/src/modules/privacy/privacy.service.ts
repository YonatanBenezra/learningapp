import { User } from '../users/user.model';
import { Course } from '../courses/course.model';
import { Module } from '../modules-content/module.model';
import { Lesson } from '../lessons/lesson.model';
import { UserLessonProgress } from '../progress/progress.model';
import { Quiz } from '../assessments/quiz.model';
import { QuizSubmission } from '../assessments/quizSubmission.model';
import { Exam } from '../assessments/exam.model';
import { ExamSubmission } from '../assessments/examSubmission.model';
import { Exercise } from '../exercises/exercise.model';
import { ExerciseSubmission } from '../exercises/submission.model';
import { UserAchievement } from '../gamification/userAchievement.model';
import { UsageQuota } from '../subscriptions/usageQuota.model';
import { Subscription } from '../subscriptions/subscription.model';
import { Notification } from '../notifications/notification.model';
import { AiUsage } from '../ai-guidance/aiUsage.model';
import { RefreshToken } from '../auth/refreshToken.model';
import { AppError } from '../../common/errors/AppError';
import { logger } from '../../common/utils/logger';
import { env } from '../../config/env';

// GDPR data portability (§12): a complete, portable snapshot of everything tied
// to the user. Content models apply their toJSON transforms (e.g. quiz/exam
// correctAnswer stays stripped; user passwordHash never serialized).
export async function exportUserData(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const courses = await Course.find({ userId });
  const courseIds = courses.map((c) => c._id);

  const [
    modules,
    lessons,
    progress,
    quizzes,
    quizSubmissions,
    exams,
    examSubmissions,
    exercises,
    exerciseSubmissions,
    achievements,
    usageQuota,
    subscription,
    notifications,
    aiUsage,
  ] = await Promise.all([
    Module.find({ courseId: { $in: courseIds } }),
    Lesson.find({ courseId: { $in: courseIds } }),
    UserLessonProgress.find({ userId }),
    Quiz.find({ userId }),
    QuizSubmission.find({ userId }),
    Exam.find({ userId }),
    ExamSubmission.find({ userId }),
    Exercise.find({ userId }),
    ExerciseSubmission.find({ userId }),
    UserAchievement.find({ userId }).populate('achievementId'),
    UsageQuota.find({ userId }),
    Subscription.findOne({ userId }),
    Notification.find({ userId }),
    AiUsage.find({ userId }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    courses,
    modules,
    lessons,
    progress,
    quizzes,
    quizSubmissions,
    exams,
    examSubmissions,
    exercises,
    exerciseSubmissions,
    achievements,
    usageQuota,
    subscription,
    notifications,
    aiUsage,
  };
}

// Immediate soft-delete (§12): mark the account, force logout everywhere. Login is
// blocked from now on; the purge job hard-deletes after the retention window.
export async function softDeleteUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  // Idempotent: keep the ORIGINAL deletion time so repeated calls can't push back
  // the purge retention clock.
  if (!user.get('deletedAt')) {
    user.set('deletedAt', new Date());
    await user.save();
  }
  await RefreshToken.updateMany({ userId }, { revoked: true });
  return user;
}

// Hard cascade delete of every collection owned by the user. Used by the purge
// job (and directly testable).
export async function deleteAllUserData(userId: string): Promise<void> {
  const courses = await Course.find({ userId }).select('_id');
  const courseIds = courses.map((c) => c._id);

  await Promise.all([
    Module.deleteMany({ courseId: { $in: courseIds } }),
    Lesson.deleteMany({ courseId: { $in: courseIds } }),
    Course.deleteMany({ userId }),
    UserLessonProgress.deleteMany({ userId }),
    Quiz.deleteMany({ userId }),
    QuizSubmission.deleteMany({ userId }),
    Exam.deleteMany({ userId }),
    ExamSubmission.deleteMany({ userId }),
    Exercise.deleteMany({ userId }),
    ExerciseSubmission.deleteMany({ userId }),
    UserAchievement.deleteMany({ userId }),
    UsageQuota.deleteMany({ userId }),
    Subscription.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    AiUsage.deleteMany({ userId }),
    RefreshToken.deleteMany({ userId }),
  ]);
  await User.deleteOne({ _id: userId });
}

// Purge job (§12): hard-delete accounts soft-deleted longer ago than the retention
// window. Injectable now/window for testing.
export async function purgeDeletedUsers(
  now: Date = new Date(),
  windowDays: number = env.accountPurgeWindowDays,
): Promise<number> {
  const cutoff = new Date(now.getTime() - windowDays * 86_400_000);
  const users = await User.find({ deletedAt: { $ne: null, $lte: cutoff } }).select('_id');
  for (const u of users) {
    await deleteAllUserData(String(u._id));
  }
  logger.info({ purged: users.length, windowDays }, 'Purged soft-deleted accounts');
  return users.length;
}
