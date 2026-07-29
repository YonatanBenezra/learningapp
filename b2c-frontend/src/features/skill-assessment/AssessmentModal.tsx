'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ASSESSMENT_SEEN_KEY } from '@/src/features/skill-assessment/skillAssessmentApi';

/** Sends first-time visitors to the dedicated assessment start page. */
export function AssessmentModal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const forceOpen = searchParams.get('assessment') === '1';
    const seen = localStorage.getItem(ASSESSMENT_SEEN_KEY);
    if (forceOpen || !seen) {
      router.replace('/assessment/start');
    }
  }, [searchParams, router]);

  return null;
}

export default AssessmentModal;
