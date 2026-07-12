import { z } from 'zod';
import { getAiClient } from '../ai-guidance/ai.client';
import { COURSE_SYSTEM_PROMPT, buildCoursePrompt } from '../ai-guidance/prompts';

// Shape the AI must return for a generated course (validated by AiClient + here).
export const GeneratedLessonSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
});

export const GeneratedModuleSchema = z.object({
  title: z.string().min(1),
  domain: z.enum(['programming', 'networking', 'cybersecurity', 'os', 'general']),
  lessons: z.array(GeneratedLessonSchema).min(1),
});

export const GeneratedCourseSchema = z.object({
  title: z.string().min(1),
  modules: z.array(GeneratedModuleSchema).min(1),
});

export type GeneratedCourse = z.infer<typeof GeneratedCourseSchema>;

export interface CourseGenInput {
  category: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  visualsPreferred: boolean;
  userId?: string | null;
}

export type CourseTreeGenerator = (input: CourseGenInput) => Promise<GeneratedCourse>;

// Calls the shared AI layer to produce a Course -> Module -> Lesson tree (§1.3).
export const generateCourseTree: CourseTreeGenerator = async (input) => {
  const prompt = `${buildCoursePrompt({
    category: input.category,
    topics: input.topics,
    level: input.level,
    visualsPreferred: input.visualsPreferred,
  })}

Each module carries a domain tag (programming | networking | cybersecurity | os | general).
Each lesson has a title and a one- or two-sentence summary. Order modules and lessons progressively.`;

  const result = await getAiClient().completeStructured(
    { system: COURSE_SYSTEM_PROMPT, prompt, useCase: 'course', userId: input.userId ?? null },
    GeneratedCourseSchema,
  );
  return result.data;
};
