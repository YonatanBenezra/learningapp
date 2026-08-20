'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useTranslation } from '@/src/i18n';
import { useLesson } from '@/src/features/lessons';
import { lessonPlayerBackHref } from '@/src/features/auth/learnerRoutes';
import { LessonGeneratingOverlay } from '@/src/features/lessons/components/LessonGeneratingOverlay';
import { useGenerateQuiz, useQuiz, useSubmitQuiz } from '../useAssessments';
import { LessonQuizError, LessonQuizLoading, LessonQuizView } from './LessonQuizView';

export function QuizRunner({ quizId, lessonId }: { quizId: string; lessonId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const quizQ = useQuiz(quizId);
  const lessonQ = useLesson(lessonId);
  const submitMut = useSubmitQuiz(quizId);
  const genMut = useGenerateQuiz();
  const [retakeOpen, setRetakeOpen] = useState(false);
  const backHref = lessonPlayerBackHref({
    lessonId,
    courseId: lessonQ.data?.lesson.courseId,
    canEditContent: lessonQ.data?.canEditContent,
    instructorCourseId: lessonQ.data?.instructorCourseId,
  });
  const backLabel = t('assessmentRunner.backToLesson');
  const lessonTitle = lessonQ.data?.lesson.title;

  function startRetake() {
    setRetakeOpen(true);
    genMut.reset();
    genMut.mutate(lessonId, {
      onSuccess: (quiz) => router.push(`/lesson/${lessonId}/quiz/${quiz.id}`),
    });
  }

  if (quizQ.isLoading || lessonQ.isLoading) return <LessonQuizLoading />;
  if (quizQ.isError || !quizQ.data) {
    return <LessonQuizError backHref={backHref} backLabel={backLabel} label={t('assessmentRunner.quizNotFound')} />;
  }

  return (
    <>
      <LessonQuizView
        title={lessonTitle ?? t('assessmentRunner.lessonQuiz')}
        questions={quizQ.data.questions}
        submission={submitMut.data ?? null}
        submitting={submitMut.isPending}
        submitError={
          submitMut.isError
            ? submitMut.error instanceof ApiError
              ? submitMut.error.message
              : t('assessments.submitError')
            : null
        }
        onSubmit={(answers) => submitMut.mutate(answers)}
        backHref={backHref}
        backLabel={backLabel}
        retaking={genMut.isPending}
        onRetake={startRetake}
      />
      <LessonGeneratingOverlay
        open={retakeOpen}
        kind="quiz"
        lessonTitle={lessonTitle}
        pending={retakeOpen && !genMut.isError && !genMut.isSuccess}
        errorMessage={
          genMut.isError
            ? genMut.error instanceof ApiError
              ? genMut.error.message
              : t('player.generateQuizRetry')
            : null
        }
        onRetry={startRetake}
        onClose={() => {
          genMut.reset();
          setRetakeOpen(false);
        }}
      />
    </>
  );
}

export default QuizRunner;
