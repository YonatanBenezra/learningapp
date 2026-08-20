import { apiClient } from '@/src/infrastructure/apiClient';
import type {
  Quiz,
  Exam,
  AssessmentSubmission,
  SubmittedAnswer,
  QuizHistoryItem,
  ExamHistoryItem,
} from '@/src/domain/assessment';

// ── Quizzes (lesson-scoped) ────────────────────────────────────────────────
export function generateQuiz(lessonId: string): Promise<Quiz> {
  return apiClient<{ quiz: Quiz }>(`/lessons/${lessonId}/quizzes`, { method: 'POST' }).then(
    (r) => r.quiz,
  );
}

export function getQuiz(quizId: string): Promise<Quiz> {
  return apiClient<{ quiz: Quiz }>(`/quizzes/${quizId}`).then((r) => r.quiz);
}

export function submitQuiz(
  quizId: string,
  answers: SubmittedAnswer[],
): Promise<AssessmentSubmission> {
  return apiClient<{ submission: AssessmentSubmission }>(`/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }).then((r) => r.submission);
}

// ── Exams (module- or course-scoped) ───────────────────────────────────────
export function generateModuleExam(moduleId: string): Promise<Exam> {
  return apiClient<{ exam: Exam }>(`/modules/${moduleId}/exam`, { method: 'POST' }).then(
    (r) => r.exam,
  );
}

export function generateCourseExam(courseId: string): Promise<Exam> {
  return apiClient<{ exam: Exam }>(`/courses/${courseId}/exam`, { method: 'POST' }).then(
    (r) => r.exam,
  );
}

export function getExam(examId: string): Promise<Exam> {
  return apiClient<{ exam: Exam }>(`/exams/${examId}`).then((r) => r.exam);
}

export function submitExam(
  examId: string,
  answers: SubmittedAnswer[],
): Promise<AssessmentSubmission> {
  return apiClient<{ submission: AssessmentSubmission }>(`/exams/${examId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }).then((r) => r.submission);
}

export function listMyQuizzes() {
  return apiClient<{ submissions: QuizHistoryItem[] }>('/quizzes/mine').then((r) => r.submissions);
}

export function listMyExams() {
  return apiClient<{ submissions: ExamHistoryItem[] }>('/exams/mine').then((r) => r.submissions);
}
