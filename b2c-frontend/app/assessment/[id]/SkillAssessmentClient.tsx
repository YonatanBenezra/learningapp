'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/src/components/marketing/Container';
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

function topicLabel(topic: string, customTopic: string | null) {
  return topic === 'Other' && customTopic ? customTopic : topic;
}

function assessmentStatus(assessment: { status?: string; questions: unknown[] }) {
  if (assessment.status) return assessment.status;
  return assessment.questions.length > 0 ? 'ready' : 'generating';
}

export default function SkillAssessmentPage({ id }: { id: string }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { data: assessment, isLoading, isError } = useSkillAssessment(id);
  const { data: submission, isLoading: loadingResult } = useSkillAssessmentResult(id, isAuthenticated);
  const submit = useSubmitSkillAssessment(id);

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
      <Container className="max-w-[1240px] py-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card">
          <h1 className="text-2xl font-semibold text-ink">Assessment not found</h1>
          <p className="mt-2 text-sm text-ink-2">
            This assessment may have expired or been removed.
          </p>
        </div>
      </Container>
    );
  }

  const status = assessmentStatus(assessment);

  if (status === 'generating') {
    return (
      <AssessmentGeneratingPanel
        topicLabel={topicLabel(assessment.topic, assessment.customTopic)}
      />
    );
  }

  if (status === 'failed') {
    return (
      <AssessmentFailedPanel
        topicLabel={topicLabel(assessment.topic, assessment.customTopic)}
        reason={assessment.failureReason}
      />
    );
  }

  return (
    <PaginatedSkillAssessment
      assessmentId={id}
      topicLabel={topicLabel(assessment.topic, assessment.customTopic)}
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
