'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchGuidedCourseById,
  fetchGuidedCourseStructure,
  fetchGuidedLesson,
} from './curatedCoursesApi';

export function useGuidedCourse(id: string | null) {
  return useQuery({
    queryKey: ['guided-course', id],
    queryFn: () => fetchGuidedCourseById(id as string),
    enabled: Boolean(id),
  });
}

export function useGuidedCourseStructure(id: string | null) {
  return useQuery({
    queryKey: ['guided-course', id, 'structure'],
    queryFn: () => fetchGuidedCourseStructure(id as string),
    enabled: Boolean(id),
  });
}

export function useGuidedLesson(id: string | null) {
  return useQuery({
    queryKey: ['guided-lesson', id],
    queryFn: () => fetchGuidedLesson(id as string),
    enabled: Boolean(id),
  });
}
