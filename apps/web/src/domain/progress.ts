export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  status: LessonProgressStatus;
  completedAt?: string | null;
}
