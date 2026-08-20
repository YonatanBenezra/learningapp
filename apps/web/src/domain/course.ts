export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'generating' | 'ready' | 'failed' | 'archived' | 'completed';
export type Domain = 'programming' | 'networking' | 'cybersecurity' | 'os' | 'general';

export interface Course {
  id: string;
  title: string;
  category: string;
  topics: string[];
  level: CourseLevel;
  status: CourseStatus;
  progressPercent: number;
  moduleOrder: string[];
  failureReason?: string | null;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  domain: Domain;
  order: number;
  lessonOrder: string[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: unknown;
  order: number;
}
