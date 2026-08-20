'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import * as coursesApi from './coursesApi';

export function useCreateCourse() {
  return useMutation({ mutationFn: coursesApi.createCourse });
}

// Fetches a course; while it is still `generating`, polls every 1.5s until it
// resolves to ready/failed.
export function useCourse(id: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getCourse(id as string),
    enabled: Boolean(id) && (options?.enabled ?? true),
    refetchInterval: (query) =>
      query.state.data?.course.status === 'generating' ? 1500 : false,
  });
}

export function useCourses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.listCourses,
    enabled: options?.enabled ?? true,
  });
}

export function useCourseStructure(
  id: string | null,
  options?: { pollWhileGenerating?: boolean },
) {
  return useQuery({
    queryKey: ['course', id, 'structure'],
    queryFn: () => coursesApi.getStructure(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!options?.pollWhileGenerating) return false;
      const status = query.state.data?.course.status;
      return status === 'generating' ? 1500 : false;
    },
  });
}
