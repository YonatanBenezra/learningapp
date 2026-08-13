'use client';

import { useRouter } from 'next/navigation';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useTranslation } from '@/src/i18n';
import { learnerCoursePath, myCoursesPath } from '@/src/features/auth/learnerRoutes';
import { useExam, useGenerateExam, useSubmitExam } from '../useAssessments';
import { AssessmentView } from './AssessmentView';
import { AssessmentShell, AssessmentError, AssessmentLoading } from './shell';

export function ExamRunner({ examId }: { examId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const examQ = useExam(examId);
  const submitMut = useSubmitExam(examId);
  const genMut = useGenerateExam();

  if (examQ.isLoading) return <AssessmentLoading />;
  if (examQ.isError || !examQ.data)
    return (
      <AssessmentError
        backHref={myCoursesPath()}
        backLabel={t('assessmentRunner.courses')}
        label={t('assessmentRunner.examNotFound')}
      />
    );

  const exam = examQ.data;
  const backHref = exam.scope === 'course' ? learnerCoursePath(exam.scopeId) : myCoursesPath();
  const backLabel =
    exam.scope === 'course' ? t('player.backToCourse') : t('assessmentRunner.courses');
  const examTitle =
    exam.scope === 'course' ? t('assessmentRunner.courseExam') : t('assessmentRunner.moduleExam');

  return (
    <AssessmentShell>
      <AssessmentView
        eyebrow={examTitle}
        submitLabel={t('assessmentRunner.submitExam')}
        title={examTitle}
        subtitle={t('assessmentRunner.examInstructions')}
        questions={exam.questions}
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
        onRetake={() =>
          genMut.mutate(
            { scope: exam.scope, scopeId: exam.scopeId },
            { onSuccess: (fresh) => router.push(`/exam/${fresh.id}`) },
          )
        }
      />
    </AssessmentShell>
  );
}

export default ExamRunner;
