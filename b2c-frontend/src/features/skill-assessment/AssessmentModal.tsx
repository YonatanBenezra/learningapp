'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import {
  ASSESSMENT_SEEN_KEY,
  markAssessmentPromptSeen,
} from '@/src/features/skill-assessment/skillAssessmentApi';
import { useMySkillAssessments } from '@/src/features/skill-assessment/useSkillAssessment';

/** Sends first-time visitors to the dedicated assessment start page. */
export function AssessmentModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useAuthHydrated();
  const { data, isLoading, isSuccess } = useMySkillAssessments();

  useEffect(() => {
    const forceOpen = searchParams.get('assessment') === '1';
    if (forceOpen) {
      router.replace('/assessment/start');
      return;
    }

    const seen = localStorage.getItem(ASSESSMENT_SEEN_KEY);
    if (seen) return;

    if (!hydrated || isLoading) return;

    const hasAssessments = isSuccess && (data?.assessments?.length ?? 0) > 0;
    if (hasAssessments) {
      markAssessmentPromptSeen();
      return;
    }

    router.replace('/assessment/start');
  }, [searchParams, router, hydrated, isLoading, isSuccess, data?.assessments?.length]);

  return null;
}

export default AssessmentModal;
