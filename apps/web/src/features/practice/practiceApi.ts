import { apiClient } from '@/src/infrastructure/apiClient';
import type { GuestPracticeBundle } from '@aieng/shared';
import { getOrCreateGuestBundle } from './guestStorage';

export interface ProblemPublic {
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  type: string;
  prompt: string;
  options: string[] | null;
  order: number;
}

export interface SubmitResult {
  submissionId: string;
  correct: boolean;
  score: number;
  feedback: string;
  correctAnswer: string;
  topic: string;
}

export function getGuestSessionId(): string {
  return getOrCreateGuestBundle().guestSessionId;
}

export async function fetchNextProblem(excludeSlugs: string[]): Promise<ProblemPublic | null> {
  const exclude = excludeSlugs.length ? `?exclude=${encodeURIComponent(excludeSlugs.join(','))}` : '';
  const data = await apiClient<{ problem: ProblemPublic | null }>(`/problems/next${exclude}`);
  return data.problem;
}

export async function fetchProblem(slug: string): Promise<ProblemPublic> {
  const data = await apiClient<{ problem: ProblemPublic }>(`/problems/${slug}`);
  return data.problem;
}

export async function submitProblem(
  slug: string,
  body: {
    guestSessionId: string;
    answer: string;
    completedCount: number;
    clientSubmissionId?: string;
  },
): Promise<SubmitResult> {
  const data = await apiClient<{ result: SubmitResult }>(`/problems/${slug}/submit`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.result;
}

export async function syncPractice(bundle: GuestPracticeBundle): Promise<{ merged: number; totalCompleted: number }> {
  const data = await apiClient<{ summary: { merged: number; totalCompleted: number } }>(
    '/practice/sync',
    {
      method: 'POST',
      body: JSON.stringify(bundle),
    },
  );
  return data.summary;
}
