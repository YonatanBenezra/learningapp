'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/src/features/auth/guards';
import { Container } from '@/src/components/marketing/Container';
import { buttonClasses } from '@/src/components/ui/button';
import { SkillAssessmentResultView } from '@/src/features/skill-assessment/SkillAssessmentResultView';
import { AssessmentResultSkeleton } from '@/src/features/skill-assessment/SkillAssessmentSkeletons';
import {
  buildLearningPathPrefill,
  readLearningGoal,
  saveLearningPathPrefill,
  type LearningPathPrefill,
} from '@/src/features/learning-path/learningPathRecommendation';
import {
  pendingAnswersKey,
} from '@/src/features/skill-assessment/skillAssessmentApi';
import {
  useSkillAssessment,
  useSkillAssessmentResult,
  useSubmitSkillAssessment,
} from '@/src/features/skill-assessment/useSkillAssessment';
import type { SubmittedAnswer } from '@/src/domain/assessment';
import { useTranslation, useAssessmentTopicLabel } from '@/src/i18n';

function ResultContent({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const submit = useSubmitSkillAssessment(id);
  const { data: assessment, isLoading: loadingAssessment } = useSkillAssessment(id);
  const {
    data: submission,
    isLoading: loadingResult,
    isError: resultError,
    refetch,
  } = useSkillAssessmentResult(id, !submit.isPending);
  const [pendingDone, setPendingDone] = useState(false);
  const displayTopic = useAssessmentTopicLabel(
    assessment?.topic ?? '',
    assessment?.customTopic ?? null,
  );

  useEffect(() => {
    if (pendingDone || submit.isPending || submit.isSuccess) return;
    const raw = sessionStorage.getItem(pendingAnswersKey(id));
    if (!raw) return;
    try {
      const answers = JSON.parse(raw) as SubmittedAnswer[];
      submit.mutate(answers, {
        onSuccess: () => {
          sessionStorage.removeItem(pendingAnswersKey(id));
          setPendingDone(true);
          void refetch();
        },
      });
    } catch {
      sessionStorage.removeItem(pendingAnswersKey(id));
    }
  }, [id, pendingDone, submit, refetch]);

  const answersMap = useMemo(() => {
    const map: Record<number, string> = {};
    submission?.answers.forEach((a) => {
      map[a.questionIndex] = a.answer;
    });
    return map;
  }, [submission]);

  const [prefill, setPrefill] = useState<LearningPathPrefill | null>(null);

  useEffect(() => {
    if (!assessment || !submission) return;
    const next = buildLearningPathPrefill({
      assessmentId: id,
      topic: assessment.topic,
      customTopic: assessment.customTopic,
      skillLevel: submission.level,
      goal: readLearningGoal(),
    });
    saveLearningPathPrefill(next);
    setPrefill(next);
  }, [assessment, submission, id]);

  if (loadingAssessment || loadingResult || submit.isPending) {
    return <AssessmentResultSkeleton />;
  }

  if (!assessment) {
    return (
      <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
        <Container>
          <div className="mx-auto mt-16 max-w-md text-center">
            <p className="text-lg font-medium text-ink">{t('marketing.assessNotFoundTitle')}</p>
          </div>
        </Container>
      </section>
    );
  }

  if (resultError || !submission) {
    return (
      <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
        <Container>
          <div className="mx-auto mt-16 max-w-md text-center">
            <p className="text-lg font-medium text-ink">{t('marketing.assessResultsUnavailable')}</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {t('marketing.assessResultsUnavailableDesc')}
            </p>
            <button
              type="button"
              onClick={() => router.push(`/assessment/${id}`)}
              className={buttonClasses({
                size: 'lg',
                className: 'mt-6 h-11 rounded-md px-5 text-sm font-medium shadow-none',
              })}
            >
              {t('marketing.assessReturnToAssessment')}
            </button>
          </div>
        </Container>
      </section>
    );
  }

  if (!prefill) {
    return <AssessmentResultSkeleton />;
  }

  return (
    <SkillAssessmentResultView
      topicLabel={displayTopic}
      questions={assessment.questions}
      submission={submission}
      answers={answersMap}
      prefill={prefill}
    />
  );
}

export default function SkillAssessmentResultPage({ id }: { id: string }) {
  return (
    <RequireAuth redirectTo={`/login?redirect=${encodeURIComponent(`/assessment/${id}/result`)}`}>
      <ResultContent id={id} />
    </RequireAuth>
  );
}
