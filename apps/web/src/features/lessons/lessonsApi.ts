import { apiClient } from '@/src/infrastructure/apiClient';
import type { Lesson } from '@/src/domain/course';
import type { LessonProgress } from '@/src/domain/progress';

export type LessonVisualType = 'diagram' | 'timeline' | 'comparison' | 'flowchart' | 'infographic';

export interface LessonVisual {
  type: LessonVisualType;
  title: string;
  description: string;
  elements?: string[];
}

export interface LessonSection {
  title: string;
  body: string;
  visual?: LessonVisual;
}

export interface LessonContent {
  summary?: string;
  sections?: LessonSection[];
  keyPoints?: string[];
  [key: string]: unknown;
}

export interface GetLessonResponse {
  lesson: Lesson & { courseId: string; content: LessonContent | null };
  progress: LessonProgress | null;
  canEditContent?: boolean;
  instructorCourseId?: string | null;
}

export interface CompleteLessonResult {
  progress: LessonProgress;
  streak: { current: number; lastActivityDate: string } | null;
  course: { progressPercent: number; status: string };
  achievements: string[];
}

export function getLesson(id: string): Promise<GetLessonResponse> {
  return apiClient<GetLessonResponse>(`/lessons/${id}`);
}

export function startLesson(id: string): Promise<{ progress: LessonProgress }> {
  return apiClient<{ progress: LessonProgress }>(`/lessons/${id}/start`, { method: 'POST' });
}

export function completeLesson(id: string): Promise<CompleteLessonResult> {
  return apiClient<CompleteLessonResult>(`/lessons/${id}/complete`, { method: 'POST' });
}
