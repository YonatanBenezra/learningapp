export const CURATED_COURSE_SLUG = 'rag-llm-engineering-5h';

export const PLATFORM_COURSE_OWNER_EMAIL = 'platform-courses@labpath.internal';

export type CuratedLessonActivity =
  | {
      kind: 'simulation';
      simulationSlug: string;
      simulationTitle: string;
      instructions: string;
    }
  | {
      kind: 'problems';
      problemSlugs: string[];
      instructions: string;
    };

export interface CuratedLessonSeed {
  title: string;
  estimatedMinutes: number;
  content: {
    summary: string;
    sections: Array<{ title: string; body: string }>;
    keyPoints: string[];
    activity?: CuratedLessonActivity;
  };
}

export interface CuratedModuleSeed {
  title: string;
  domain: 'general' | 'programming';
  lessons: CuratedLessonSeed[];
}
