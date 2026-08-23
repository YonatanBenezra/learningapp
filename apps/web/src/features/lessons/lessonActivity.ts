import type { LessonContent } from '@/src/features/lessons/lessonsApi';

export interface LessonSimulationActivity {
  kind: 'simulation';
  simulationSlug: string;
  simulationTitle: string;
  instructions: string;
}

export interface LessonProblemsActivity {
  kind: 'problems';
  problemSlugs: string[];
  instructions: string;
}

export type LessonActivity = LessonSimulationActivity | LessonProblemsActivity;

export function parseLessonActivity(content: LessonContent | null | undefined): LessonActivity | null {
  if (!content || typeof content !== 'object') return null;
  const activity = (content as Record<string, unknown>).activity;
  if (!activity || typeof activity !== 'object') return null;

  const record = activity as Record<string, unknown>;
  const kind = record.kind;
  if (kind === 'simulation') {
    const simulationSlug = record.simulationSlug;
    const simulationTitle = record.simulationTitle;
    const instructions = record.instructions;
    if (
      typeof simulationSlug !== 'string' ||
      typeof simulationTitle !== 'string' ||
      typeof instructions !== 'string'
    ) {
      return null;
    }
    return { kind: 'simulation', simulationSlug, simulationTitle, instructions };
  }

  if (kind === 'problems') {
    const instructions = record.instructions;
    const problemSlugs = record.problemSlugs;
    if (typeof instructions !== 'string' || !Array.isArray(problemSlugs)) return null;
    const slugs = problemSlugs.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0);
    if (slugs.length === 0) return null;
    return { kind: 'problems', problemSlugs: slugs, instructions };
  }

  return null;
}
