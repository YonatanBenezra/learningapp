import { apiClient } from '@/src/infrastructure/apiClient';
import type { Course, CourseLevel, CourseStatus, Domain } from '@/src/domain/course';

export interface StructureLesson {
  id: string;
  title: string;
  order: number;
}
export interface StructureModule {
  id: string;
  title: string;
  domain: Domain;
  order: number;
  lessonCount: number;
  lessons: StructureLesson[];
}
export interface CourseStructure {
  course: {
    id: string;
    title: string;
    status: CourseStatus;
    category: string;
    level: CourseLevel;
  };
  modules: StructureModule[];
}

export interface CreateCourseInput {
  category: string;
  topics: string[];
  level: CourseLevel;
  visualsPreferred?: boolean;
  dailyNotification?: boolean;
  aiModel?: string | null;
}

// 202 Accepted — returns the course in `generating` status; poll getCourse for readiness.
export function createCourse(input: CreateCourseInput): Promise<{ course: Course }> {
  return apiClient<{ course: Course }>('/courses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCourse(id: string): Promise<{ course: Course }> {
  return apiClient<{ course: Course }>(`/courses/${id}`);
}

export function listCourses(): Promise<{ courses: Course[] }> {
  return apiClient<{ courses: Course[] }>('/courses');
}

// Full Course → Module → Lesson tree (for the overview + the flow graph).
export function getStructure(id: string): Promise<CourseStructure> {
  return apiClient<CourseStructure>(`/courses/${id}/structure`);
}
