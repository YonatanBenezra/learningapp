import {
  FREE_PROBLEM_LIMIT,
  GUEST_PRACTICE_STORAGE_KEY,
  updateSkillStats,
  type GuestPracticeBundle,
  type GuestSubmission,
} from '@aieng/shared';

function newGuestSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function readGuestBundle(): GuestPracticeBundle | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(GUEST_PRACTICE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestPracticeBundle;
  } catch {
    return null;
  }
}

export function writeGuestBundle(bundle: GuestPracticeBundle): void {
  localStorage.setItem(GUEST_PRACTICE_STORAGE_KEY, JSON.stringify(bundle));
}

export function getOrCreateGuestBundle(): GuestPracticeBundle {
  const existing = readGuestBundle();
  if (existing?.version === 1 && existing.guestSessionId) return existing;

  const bundle: GuestPracticeBundle = {
    version: 1,
    guestSessionId: newGuestSessionId(),
    freeLimit: FREE_PROBLEM_LIMIT,
    completedCount: 0,
    synced: false,
    submissions: [],
    skillByTopic: {},
    completedSlugs: [],
  };
  writeGuestBundle(bundle);
  return bundle;
}

export function markGuestSynced(): void {
  const bundle = readGuestBundle();
  if (!bundle) return;
  writeGuestBundle({ ...bundle, synced: true });
}

export function recordGuestSubmission(input: {
  problemSlug: string;
  topic: string;
  difficulty: string;
  type: string;
  answer: string;
  score: number;
  correct: boolean;
  feedback: string;
  submissionId: string;
}): GuestPracticeBundle {
  const bundle = getOrCreateGuestBundle();
  const alreadyCompleted = bundle.completedSlugs.includes(input.problemSlug);

  const submission: GuestSubmission = {
    problemSlug: input.problemSlug,
    topic: input.topic,
    difficulty: input.difficulty,
    type: input.type,
    answer: input.answer,
    score: input.score,
    correct: input.correct,
    feedback: input.feedback,
    submittedAt: new Date().toISOString(),
    clientSubmissionId: input.submissionId,
  };

  const submissions = [
    ...bundle.submissions.filter((s) => s.problemSlug !== input.problemSlug),
    submission,
  ];

  const completedSlugs = alreadyCompleted
    ? bundle.completedSlugs
    : [...bundle.completedSlugs, input.problemSlug];

  const completedCount = completedSlugs.length;
  const skillByTopic = { ...bundle.skillByTopic };
  skillByTopic[input.topic] = updateSkillStats(
    skillByTopic[input.topic],
    input.score,
    input.correct,
  );

  const next: GuestPracticeBundle = {
    ...bundle,
    submissions,
    completedSlugs,
    completedCount,
    skillByTopic,
    lastProblemSlug: input.problemSlug,
    synced: bundle.synced,
  };
  writeGuestBundle(next);
  return next;
}

export function guestCompletedCount(): number {
  return readGuestBundle()?.completedCount ?? 0;
}
