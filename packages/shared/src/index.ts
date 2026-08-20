export {
  AI_CATEGORY_NAMES,
  AI_CATEGORY_NAME_SET,
  isAiCategory,
  type AiCategoryName,
} from './constants/aiCategories';

export {
  FREE_PROBLEM_LIMIT,
  GUEST_PRACTICE_STORAGE_KEY,
  GUEST_SESSION_STORAGE_KEY,
} from './constants/practice';

export { DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT } from './constants/assessment';

export type {
  GuestPracticeBundle,
  GuestSubmission,
  SkillTopicStats,
} from './types/guestPractice';

export { scoreToSkillLevel, updateSkillStats } from './utils/skillLevel';
