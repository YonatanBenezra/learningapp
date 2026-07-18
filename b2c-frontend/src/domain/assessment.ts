export type QuestionType = 'mcq' | 'short_answer';
export type ExamScope = 'module' | 'course';

export interface Question {
  question: string;
  type: QuestionType;
  options: string[] | null;
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  questions: Question[];
}

export interface Exam {
  id: string;
  scope: ExamScope;
  scopeId: string;
  questions: Question[];
}
