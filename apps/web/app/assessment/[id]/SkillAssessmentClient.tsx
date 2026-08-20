'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/src/components/marketing/Container';
import { buttonClasses } from '@/src/components/ui/button';
import { PaginatedSkillAssessment } from '@/src/features/skill-assessment/PaginatedSkillAssessment';
import {
  AssessmentFailedPanel,
  AssessmentGeneratingPanel,
} from '@/src/features/skill-assessment/AssessmentGeneratingPanel';
import { AssessmentTakeSkeleton } from '@/src/features/skill-assessment/SkillAssessmentSkeletons';
import {
  useSkillAssessment,
  useSkillAssessmentResult,
  useSubmitSkillAssessment,
} from '@/src/features/skill-assessment/useSkillAssessment';
import { useTranslation, useAssessmentTopicLabel } from '@/src/i18n';

import { PRACTICE_PATH } from '@/src/config/mvp';

function assessmentStatus(assessment: { status?: string; questions: unknown[] }) {
  if (assessment.status) return assessment.status;
  return assessment.questions.length > 0 ? 'ready' : 'generating';
}

export default function SkillAssessmentPage({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const practiceRedirect =
    searchParams.get('redirect')?.startsWith('/') ? searchParams.get('redirect')! : PRACTICE_PATH;
  const resultPath = `/assessment/${id}/result?redirect=${encodeURIComponent(practiceRedirect)}`;
  const { data: assessment, isLoading, isError } = useSkillAssessment(id);
  const { data: submission, isLoading: loadingResult } = useSkillAssessmentResult(id);
  const submit = useSubmitSkillAssessment(id);
  const displayTopic = useAssessmentTopicLabel(
    assessment?.topic ?? '',
    assessment?.customTopic ?? null,
  );

  useEffect(() => {
    if (submission) {
      router.replace(resultPath);
    }
  }, [submission, resultPath, router]);

  if (isLoading || loadingResult || submission) {
    return <AssessmentTakeSkeleton />;
  }

  if (isError || !assessment) {
    return (
      <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
        <Container>
          <div className="mx-auto mt-16 max-w-md text-center">
            <p className="text-lg font-medium text-ink">{t('marketing.assessNotFoundTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">{t('marketing.assessNotFoundDesc')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/assessments"
                className={buttonClasses({
                  variant: 'outline',
                  size: 'lg',
                  className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                })}
              >
                {t('marketing.assessBackToAssessments')}
              </Link>
              <Link
                href="/assessment/start"
                className={buttonClasses({
                  size: 'lg',
                  className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                })}
              >
                {t('marketing.assessCreateNew')}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const status = assessmentStatus(assessment);

  if (status === 'generating') {
    return <AssessmentGeneratingPanel topicLabel={displayTopic} />;
  }

  if (status === 'failed') {
    return (
      <AssessmentFailedPanel
        topicLabel={displayTopic}
        reason={assessment.failureReason}
      />
    );
  }

  return (
    <PaginatedSkillAssessment
      assessmentId={id}
      topicLabel={displayTopic}
      questions={assessment.questions}
      submitting={submit.isPending}
      onSubmit={(answers) =>
        submit.mutate(answers, {
          onSuccess: () => router.push(resultPath),
        })
      }
    />
  );
}
