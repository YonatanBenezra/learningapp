'use client';

import type { AsyncJobState } from '@/src/types/api';

// Shared "pending -> processing -> ready/failed" hook, reused across every
// async-triggered feature (course gen, exercise submit, quiz/exam gen). See §8.
export function useAsyncJobStatus(_pollUrl: string): { state: AsyncJobState } {
  // TODO: implement polling/SSE
  return { state: 'pending' };
}
