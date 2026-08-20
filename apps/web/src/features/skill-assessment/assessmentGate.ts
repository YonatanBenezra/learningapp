import type { SkillAssessmentSummary } from '@/src/domain/assessment';

export const ASSESSMENT_COMPLETE_KEY = 'bina-assessment-complete';

const listeners = new Set<() => void>();

function notifyAssessmentComplete() {
  listeners.forEach((listener) => listener());
}

export function subscribeAssessmentComplete(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function isAssessmentCompleteLocal(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ASSESSMENT_COMPLETE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markAssessmentComplete(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ASSESSMENT_COMPLETE_KEY, '1');
    notifyAssessmentComplete();
  } catch {
    /* ignore */
  }
}

export function hasCompletedAssessment(
  assessments: SkillAssessmentSummary[] | undefined,
): boolean {
  if (isAssessmentCompleteLocal()) return true;
  return assessments?.some((a) => a.status === 'completed') ?? false;
}

export const ASSESSMENT_START_PATH = '/assessment/start';

export function assessmentStartRedirect(returnPath: string): string {
  return `${ASSESSMENT_START_PATH}?redirect=${encodeURIComponent(returnPath)}`;
}
