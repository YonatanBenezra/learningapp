'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/src/features/auth/guards';
import { Container } from '@/src/components/marketing/Container';
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

function topicLabel(topic: string, customTopic: string | null) {
  return topic === 'Other' && customTopic ? customTopic : topic;
}

function ResultContent({ id }: { id: string }) {
  const router = useRouter();
  const submit = useSubmitSkillAssessment(id);
  const { data: assessment, isLoading: loadingAssessment } = useSkillAssessment(id);
  const {
    data: submission,
    isLoading: loadingResult,
    isError: resultError,
    refetch,
  } = useSkillAssessmentResult(id, !submit.isPending);
  const [pendingDone, setPendingDone] = useState(false);

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
      <Container className="max-w-6xl py-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card">
          <h1 className="text-2xl font-bold text-ink">Assessment not found</h1>
        </div>
      </Container>
    );
  }

  if (resultError || !submission) {
    return (
      <Container className="max-w-6xl py-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card">
          <h1 className="text-2xl font-bold text-ink">Results not available</h1>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            Complete the assessment and sign in to view your private results.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/assessment/${id}`)}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Return to assessment
          </button>
        </div>
      </Container>
    );
  }

  if (!prefill) {
    return <AssessmentResultSkeleton />;
  }

  return (
    <SkillAssessmentResultView
      topicLabel={topicLabel(assessment.topic, assessment.customTopic)}
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
