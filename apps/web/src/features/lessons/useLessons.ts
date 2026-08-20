'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as lessonsApi from './lessonsApi';
import { useAuthStore } from '@/src/store/authStore';

export function useLesson(id: string | null) {
  return useQuery({
    queryKey: ['lesson', id],
    queryFn: () => lessonsApi.getLesson(id as string),
    enabled: Boolean(id),
  });
}

export function useStartLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.startLesson,
    onSuccess: (data, lessonId) => {
      // Patch the cached lesson in place — no refetch, no flicker.
      qc.setQueryData<lessonsApi.GetLessonResponse>(['lesson', lessonId], (old) =>
        old ? { ...old, progress: data.progress } : old,
      );
    },
  });
}

export function useCompleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: lessonsApi.completeLesson,
    onSuccess: (data, lessonId) => {
      const courseId = data.progress.courseId;
      // Prefix match: ['course', courseId] also invalidates the structure query.
      qc.invalidateQueries({ queryKey: ['lesson', lessonId] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['gamification'] });

      // Keep the topbar streak in sync with the value the backend just computed.
      const user = useAuthStore.getState().user;
      if (user && data.streak) {
        useAuthStore.getState().setUser({
          ...user,
          streak: {
            current: data.streak.current,
            lastActivityDate: data.streak.lastActivityDate,
          },
        });
      }
    },
  });
}
