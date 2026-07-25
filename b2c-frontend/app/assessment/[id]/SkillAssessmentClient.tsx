'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
import { Button } from '@/src/components/ui/button';
import { PaginatedSkillAssessment } from '@/src/features/skill-assessment/PaginatedSkillAssessment';
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
  const token = useAuthStore((s) => s.accessToken);
  const { data: assessment, isLoading, isError } = useSkillAssessment(id);
  const { data: submission, isLoading: loadingResult } = useSkillAssessmentResult(id, Boolean(token));
  const submit = useSubmitSkillAssessment(id);

  useEffect(() => {
    if (token && submission) {
      router.replace(`/assessment/${id}/result`);
    }
  }, [token, submission, id, router]);

  if (isLoading || (token && loadingResult) || (token && submission)) {
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
      <Container className="max-w-[1240px] py-20">
        <div className="mx-auto max-w-xl border border-line bg-bg-elev px-6 py-12 text-center">
          <div className="mx-auto grid size-14 place-items-center border border-primary/20 bg-primary-soft text-primary">
            <Loader2 className="size-7 animate-spin" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-ink">Preparing your assessment</h1>
          <p className="mt-2 text-sm text-ink-2">
            Generating 10 questions for {topicLabel(assessment.topic, assessment.customTopic)}.
            You can leave this page — generation continues in the background.
          </p>
        </div>
      </Container>
    );
  }

  if (status === 'failed') {
    return (
      <Container className="max-w-[1240px] py-20">
        <div className="mx-auto max-w-xl border border-line bg-bg-elev px-6 py-12 text-center">
          <h1 className="text-xl font-semibold text-ink">Could not generate assessment</h1>
          <p className="mt-2 text-sm text-ink-2">
            {assessment.failureReason ?? 'Something went wrong while building your questions.'}
          </p>
          <Link href="/assessments" className="mt-6 inline-block">
            <Button variant="outline">Back to assessments</Button>
          </Link>
        </div>
      </Container>
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
