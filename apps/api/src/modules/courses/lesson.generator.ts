import { getAiClient } from '../ai-guidance/ai.client';
import { RawAiJsonSchema } from '../ai-guidance/aiJson.schema';
import { LESSON_CONTENT_SYSTEM_PROMPT, buildLessonContentPrompt } from '../ai-guidance/prompts/lesson.prompts';
import { parseGeneratedLessonContent } from './lesson.normalize';

export {
  GeneratedLessonVisualSchema,
  GeneratedLessonSectionSchema,
  GeneratedLessonContentSchema,
  type GeneratedLessonContent,
} from './lesson.schemas';

export interface LessonContentInput {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonSummary: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  visualsPreferred: boolean;
  userId?: string | null;
  aiModel?: string | null;
}

export type LessonContentGenerator = (input: LessonContentInput) => Promise<
  import('./lesson.schemas').GeneratedLessonContent
>;

export const generateLessonContent: LessonContentGenerator = async (input) => {
  const prompt = buildLessonContentPrompt(input);

  const result = await getAiClient().completeStructured(
    {
      system: LESSON_CONTENT_SYSTEM_PROMPT,
      prompt,
      useCase: 'lesson',
      userId: input.userId ?? null,
      model: input.aiModel ?? undefined,
    },
    RawAiJsonSchema,
  );
  return parseGeneratedLessonContent(result.data, {
    visualsPreferred: input.visualsPreferred,
    lessonTitle: input.lessonTitle,
  });
};
