import { apiClient } from '@/src/infrastructure/apiClient';
import type { CourseStructure } from './coursesApi';
import type { Course } from '@/src/domain/course';
import type { GetLessonResponse } from '@/src/features/lessons/lessonsApi';

export interface CuratedCoursePublic {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  estimatedHours: number | null;
  topics: string[];
  lessonCount: number;
  moduleCount: number;
  simulationCount?: number;
  problemCount?: number;
}

export const CURATED_COURSE_SLUG = 'rag-llm-engineering-5h';

export async function fetchCuratedCourses(): Promise<CuratedCoursePublic[]> {
  const data = await apiClient<{ courses: CuratedCoursePublic[] }>('/guided-courses');
  return data.courses;
}

export async function fetchCuratedCourse(slug: string): Promise<CuratedCoursePublic> {
  const data = await apiClient<{ course: CuratedCoursePublic }>(`/guided-courses/${slug}`);
  return data.course;
}

export async function fetchGuidedCourseById(courseId: string): Promise<{ course: Course }> {
  return apiClient<{ course: Course }>(`/guided-courses/id/${courseId}`);
}

export async function fetchGuidedCourseStructure(courseId: string): Promise<CourseStructure> {
  return apiClient<CourseStructure>(`/guided-courses/id/${courseId}/structure`);
}

export async function fetchGuidedLesson(lessonId: string): Promise<GetLessonResponse> {
  return apiClient<GetLessonResponse>(`/guided-courses/lessons/${lessonId}`);
}
