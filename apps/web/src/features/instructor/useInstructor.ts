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

export function useDeleteInstructorCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteInstructorCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructor'] });
    },
  });
}

function invalidateStructure(qc: ReturnType<typeof useQueryClient>, courseId: string) {
  qc.invalidateQueries({ queryKey: ['course', courseId, 'structure'] });
  qc.invalidateQueries({ queryKey: ['instructor', 'courses', courseId] });
}

export function useUpdateInstructorModuleTitle(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, title }: { moduleId: string; title: string }) =>
      api.updateInstructorModuleTitle(courseId, moduleId, title),
    onSuccess: () => invalidateStructure(qc, courseId),
  });
}

export function useDeleteInstructorModule(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => api.deleteInstructorModule(courseId, moduleId),
    onSuccess: () => invalidateStructure(qc, courseId),
  });
}

export function useUpdateInstructorLessonTitle(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, title }: { lessonId: string; title: string }) =>
      api.updateInstructorLessonTitle(courseId, lessonId, title),
    onSuccess: () => invalidateStructure(qc, courseId),
  });
}

export function useUpdateInstructorLessonContent(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      input,
    }: {
      lessonId: string;
      input: Parameters<typeof api.updateInstructorLessonContent>[2];
    }) => api.updateInstructorLessonContent(courseId, lessonId, input),
    onSuccess: (_data, variables) => {
      invalidateStructure(qc, courseId);
      qc.invalidateQueries({ queryKey: ['lesson', variables.lessonId] });
    },
  });
}

export function useDeleteInstructorLesson(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => api.deleteInstructorLesson(courseId, lessonId),
    onSuccess: () => invalidateStructure(qc, courseId),
  });
}

export function useReorderInstructorStructure(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { moduleOrder: string[]; lessonsByModule: Record<string, string[]> }) =>
      api.reorderInstructorStructure(courseId, input),
    onSuccess: () => invalidateStructure(qc, courseId),
  });
}
