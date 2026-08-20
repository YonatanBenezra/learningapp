'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import * as assessmentsApi from './assessmentsApi';
import type { SubmittedAnswer } from '@/src/domain/assessment';

// ── Quizzes ────────────────────────────────────────────────────────────────
export function useGenerateQuiz() {
  return useMutation({ mutationFn: assessmentsApi.generateQuiz });
}

export function useQuiz(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => assessmentsApi.getQuiz(quizId as string),
    enabled: Boolean(quizId),
  });
}

export function useSubmitQuiz(quizId: string) {
  return useMutation({
    mutationFn: (answers: SubmittedAnswer[]) => assessmentsApi.submitQuiz(quizId, answers),
  });
}

// ── Exams ──────────────────────────────────────────────────────────────────
// Generation is scope-aware: module exams and course exams hit different routes.
export function useGenerateExam() {
  return useMutation({
    mutationFn: (input: { scope: 'module' | 'course'; scopeId: string }) =>
      input.scope === 'module'
        ? assessmentsApi.generateModuleExam(input.scopeId)
        : assessmentsApi.generateCourseExam(input.scopeId),
  });
}

export function useExam(examId: string | null) {
  return useQuery({
    queryKey: ['exam', examId],
    queryFn: () => assessmentsApi.getExam(examId as string),
    enabled: Boolean(examId),
  });
}

export function useSubmitExam(examId: string) {
  return useMutation({
    mutationFn: (answers: SubmittedAnswer[]) => assessmentsApi.submitExam(examId, answers),
  });
}

export function useMyQuizzes() {
  return useQuery({
    queryKey: ['quizzes', 'mine'],
    queryFn: assessmentsApi.listMyQuizzes,
  });
}

export function useMyExams() {
  return useQuery({
    queryKey: ['exams', 'mine'],
    queryFn: assessmentsApi.listMyExams,
  });
}
