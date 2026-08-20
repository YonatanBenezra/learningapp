/** Single guest submission stored in localStorage until login sync. */
export interface GuestSubmission {
  problemSlug: string;
  topic: string;
  difficulty: string;
  type: string;
  answer: string;
  score: number;
  correct: boolean;
  feedback: string;
  submittedAt: string;
  clientSubmissionId?: string;
}

export interface SkillTopicStats {
  attempted: number;
  passed: number;
  avgScore: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}

/** localStorage bundle for guest practice (key: bina-practice-guest). */
export interface GuestPracticeBundle {
  version: 1;
  guestSessionId: string;
  freeLimit: number;
  completedCount: number;
  synced: boolean;
  lastProblemSlug?: string;
  submissions: GuestSubmission[];
  skillByTopic: Record<string, SkillTopicStats>;
  completedSlugs: string[];
}
