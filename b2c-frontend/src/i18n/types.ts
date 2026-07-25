export type Locale = 'en' | 'bn' | 'he' | 'de' | 'zh' | 'es' | 'fr' | 'ar' | 'hi' | 'ja';

export const SUPPORTED_LOCALES: Locale[] = [
  'en',
  'bn',
  'he',
  'de',
  'zh',
  'es',
  'fr',
  'ar',
  'hi',
  'ja',
];

export const LOCALE_STORAGE_KEY = 'bina-locale';

type StringMap = Record<string, string>;

export interface Messages {
  common: StringMap & {
    retry: string;
    save: string;
    cancel: string;
    loading: string;
    search: string;
    backToApp: string;
    newCourse: string;
    viewAll: string;
    submit: string;
    continue: string;
    browseCourses: string;
    signIn: string;
    signUp: string;
    logIn: string;
    startFree: string;
  };
  nav: StringMap & {
    dashboard: string;
    courses: string;
    quizzes: string;
    exams: string;
    assessments: string;
    achievements: string;
    settings: string;
    notifications: string;
    upgrade: string;
    logout: string;
    admin: string;
    adminMetrics: string;
    adminCosts: string;
    adminContent: string;
    instructor: string;
    instructorDashboard: string;
    instructorCourses: string;
    instructorSales: string;
    home: string;
    learningPath: string;
    pricing: string;
    contact: string;
  };
  auth: StringMap;
  dashboard: StringMap;
  courses: StringMap;
  assessments: StringMap;
  settings: StringMap;
  achievements: StringMap;
  admin: StringMap;
  instructor: StringMap & {
    newCourse: string;
  };
  marketing: StringMap;
}
