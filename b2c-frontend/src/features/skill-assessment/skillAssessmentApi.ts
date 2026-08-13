import { apiClient } from '@/src/infrastructure/apiClient';
import type {
  SkillAssessment,
  SkillAssessmentQuota,
  SkillAssessmentSubmission,
  SkillAssessmentSummary,
  SubmittedAnswer,
} from '@/src/domain/assessment';

export const SKILL_TOPICS = [
  'Programming',
  'Artificial Intelligence',
  'Cyber Security',
  'Networking',
  'Data Science',
  'Health & Fitness',
  'Security',
  'General',
  'Other',
] as const;

export type SkillTopic = (typeof SKILL_TOPICS)[number];

export const GUEST_SESSION_KEY = 'bina-guest-session-id';
export const ASSESSMENT_SEEN_KEY = 'bina-skill-assessment-seen';
export const pendingAnswersKey = (id: string) => `bina-skill-assessment-pending-${id}`;

export function markAssessmentPromptSeen() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ASSESSMENT_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function getGuestSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

export function listMySkillAssessments() {
  const guestSessionId = getGuestSessionId();
  const query = guestSessionId
    ? `?guestSessionId=${encodeURIComponent(guestSessionId)}`
    : '';
  return apiClient<{ assessments: SkillAssessmentSummary[]; quota: SkillAssessmentQuota }>(
    `/skill-assessments/mine${query}`,
  );
}

export function generateSkillAssessment(input: {
  topic: SkillTopic;
  customTopic?: string;
  aiModel?: string | null;
}) {
  return apiClient<{ assessment: SkillAssessment }>('/skill-assessments/generate', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      aiModel: input.aiModel?.trim() || null,
      guestSessionId: getGuestSessionId(),
    }),
  }).then((r) => r.assessment);
}

export function getSkillAssessment(id: string) {
  return apiClient<{ assessment: SkillAssessment }>(`/skill-assessments/${id}`).then(
    (r) => r.assessment,
  );
}

export function submitSkillAssessment(id: string, answers: SubmittedAnswer[]) {
  return apiClient<{ submission: SkillAssessmentSubmission }>(
    `/skill-assessments/${id}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({ answers }),
    },
  ).then((r) => r.submission);
}

export function getSkillAssessmentResult(id: string) {
  return apiClient<{ submission: SkillAssessmentSubmission }>(
    `/skill-assessments/${id}/result`,
  ).then((r) => r.submission);
}
