export type QuestionType = 'mcq' | 'short_answer';
export type ExamScope = 'module' | 'course';

// A question as served for taking. The backend's toJSON strips `correctAnswer`
// (see quiz.model stripAnswers) — it's only revealed in a submission's results.
export interface AssessmentQuestion {
  question: string;
  type: QuestionType;
  options: string[] | null;
}

export interface Quiz {
  id: string;
  lessonId: string;
  userId: string;
  questions: AssessmentQuestion[];
  generatedAt: string;
}

export interface Exam {
  id: string;
  scope: ExamScope;
  scopeId: string;
  userId: string;
  questions: AssessmentQuestion[];
  generatedAt: string;
}

export interface SubmittedAnswer {
  questionIndex: number;
  answer: string;
}

// Per-question grading outcome — includes the correct answer + feedback so the
// results view can teach after submission.
export interface GradedResult {
  questionIndex: number;
  correct: boolean;
  correctAnswer: string;
  feedback: string;
}

// Shared by quiz + exam submissions (same schema on the backend).
export interface AssessmentSubmission {
  id: string;
  userId: string;
  answers: SubmittedAnswer[];
  results: GradedResult[];
  score: number; // 0–100
  submittedAt: string;
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type SkillAssessmentGenerationStatus = 'generating' | 'ready' | 'failed';

export interface SkillAssessment {
  id: string;
  topic: string;
  customTopic: string | null;
  questions: AssessmentQuestion[];
  generatedAt: string;
  status?: SkillAssessmentGenerationStatus;
  failureReason?: string | null;
}

export interface SkillAssessmentSubmission extends AssessmentSubmission {
  assessmentId: string;
  level: SkillLevel;
}

export type SkillAssessmentStatus = 'pending' | 'completed';

export interface SkillAssessmentSummary {
  id: string;
  topic: string;
  customTopic: string | null;
  topicLabel: string;
  questionCount: number;
  generatedAt: string;
  expiresAt: string;
  generationStatus?: SkillAssessmentGenerationStatus;
  failureReason?: string | null;
  status: SkillAssessmentStatus;
  submission?: {
    score: number;
    level: SkillLevel;
    submittedAt: string;
  };
}

export interface SkillAssessmentQuota {
  tier: string;
  limit: number | null;
  used: number;
  remaining: number | null;
}

export interface QuizHistoryItem {
  id: string;
  quizId: string;
  lessonId: string | null;
  lessonTitle: string;
  score: number;
  submittedAt: string;
  questionCount: number;
}

export interface ExamHistoryItem {
  id: string;
  examId: string;
  scope: ExamScope;
  scopeId: string | null;
  scopeTitle: string;
  score: number;
  submittedAt: string;
  questionCount: number;
}
