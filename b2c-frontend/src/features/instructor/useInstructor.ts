'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './instructorApi';
import type {
  CreateInstructorCourseInput,
  UpdateInstructorCourseInput,
} from '@/src/domain/instructor';

export function useInstructorDashboard() {
  return useQuery({
    queryKey: ['instructor', 'dashboard'],
    queryFn: api.getInstructorDashboard,
  });
}

export function useInstructorCourses() {
  return useQuery({
    queryKey: ['instructor', 'courses'],
    queryFn: api.listInstructorCourses,
  });
}

export function useInstructorCourse(id: string) {
  return useQuery({
    queryKey: ['instructor', 'courses', id],
    queryFn: () => api.getInstructorCourse(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.course.status;
      return status === 'generating' ? 2000 : false;
    },
  });
}

export function useInstructorSales() {
  return useQuery({
    queryKey: ['instructor', 'sales'],
    queryFn: api.listInstructorSales,
  });
}

export function useCreateInstructorCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInstructorCourseInput) => api.createInstructorCourse(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructor'] });
    },
  });
}

export function useUpdateInstructorCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInstructorCourseInput) => api.updateInstructorCourse(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructor'] });
    },
  });
}

export function usePublishInstructorCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.publishInstructorCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructor'] });
    },
  });
}

export function useUnpublishInstructorCourse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.unpublishInstructorCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructor'] });
    },
  });
}
