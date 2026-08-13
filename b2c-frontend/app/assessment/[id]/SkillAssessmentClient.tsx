'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
import { Button } from '@/src/components/ui/button';
import { PaginatedSkillAssessment } from '@/src/features/skill-assessment/PaginatedSkillAssessment';
import {
  AssessmentFailedPanel,
  AssessmentGeneratingPanel,
} from '@/src/features/skill-assessment/AssessmentGeneratingPanel';
import { AssessmentTakeSkeleton } from '@/src/features/skill-assessment/SkillAssessmentSkeletons';
import { useAuthStore } from '@/src/store/authStore';
import {
  useSkillAssessment,
  useSkillAssessmentResult,
  useSubmitSkillAssessment,
} from '@/src/features/skill-assessment/useSkillAssessment';
import { useTranslation, useAssessmentTopicLabel } from '@/src/i18n';

function assessmentStatus(assessment: { status?: string; questions: unknown[] }) {
  if (assessment.status) return assessment.status;
  return assessment.questions.length > 0 ? 'ready' : 'generating';
}

export default function SkillAssessmentPage({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { data: assessment, isLoading, isError } = useSkillAssessment(id);
  const { data: submission, isLoading: loadingResult } = useSkillAssessmentResult(id, isAuthenticated);
  const submit = useSubmitSkillAssessment(id);
  const displayTopic = useAssessmentTopicLabel(
    assessment?.topic ?? '',
    assessment?.customTopic ?? null,
  );

  useEffect(() => {
    if (isAuthenticated && submission) {
      router.replace(`/assessment/${id}/result`);
    }
  }, [isAuthenticated, submission, id, router]);

  if (isLoading || (isAuthenticated && loadingResult) || (isAuthenticated && submission)) {
    return <AssessmentTakeSkeleton />;
  }

  if (isError || !assessment) {
    return (
      <Container className="max-w-[1240px] py-16 lg:py-20">
        <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
          <div className="border-b border-line bg-bg-soft/50 px-8 py-10 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-line bg-bg-elev text-ink-3">
              <ClipboardList className="size-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-ink">{t('marketing.assessNotFoundTitle')}</h1>
            <p className="mt-2 text-sm leading-6 text-ink-2">{t('marketing.assessNotFoundDesc')}</p>
          </div>
          <div className="flex justify-center gap-3 px-8 py-6">
            <Link href="/assessments">
              <Button variant="outline" className="rounded-xl">
                {t('marketing.assessBackToAssessments')}
              </Button>
            </Link>
            <Link href="/assessment/start">
              <Button className="rounded-xl">{t('marketing.assessCreateNew')}</Button>
            </Link>
          </div>
        </div>
      </Container>
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
          onSuccess: () => router.push(`/assessment/${id}/result`),
        })
      }
    />
  );
}
