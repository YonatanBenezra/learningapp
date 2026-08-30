import { R1_REFERENCE_PAYLOAD, R1_SLUG } from '../../catalogue/exercises/exercises.constants';

export const ONBOARDING_EXERCISE_SLUG = R1_SLUG;

export const ONBOARDING_STARTER = R1_REFERENCE_PAYLOAD;

export const ONBOARDING_EVENTS = ['first_submit', 'first_pass'] as const;

export type OnboardingEventName = (typeof ONBOARDING_EVENTS)[number];

export type OnboardingState = {
  needed: boolean;
  exerciseSlug: string;
  starter: Record<string, unknown>;
  createdAt: string;
  timeToFirstSubmitMs: number | null;
  timeToFirstPassMs: number | null;
};

export function elapsedMs(from: Date, to = new Date()): number {
  return Math.max(0, to.getTime() - from.getTime());
}
