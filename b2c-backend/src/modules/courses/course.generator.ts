import { getAiClient } from '../ai-guidance/ai.client';
import { RawAiJsonSchema } from '../ai-guidance/aiJson.schema';
import { COURSE_SYSTEM_PROMPT, buildCoursePrompt } from '../ai-guidance/prompts';
import { parseGeneratedCourse, type GeneratedCourse } from './course.normalize';

export {
  GeneratedCourseSchema,
  GeneratedModuleSchema,
  GeneratedLessonSchema,
  type GeneratedCourse,
} from './course.schemas';

export interface CourseGenInput {
  category: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  visualsPreferred: boolean;
  userId?: string | null;
  aiModel?: string | null;
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
    {
      system: COURSE_SYSTEM_PROMPT,
      prompt,
      useCase: 'course',
      userId: input.userId ?? null,
      model: input.aiModel ?? undefined,
    },
    RawAiJsonSchema,
  );
  return parseGeneratedCourse(result.data, input.category);
};
