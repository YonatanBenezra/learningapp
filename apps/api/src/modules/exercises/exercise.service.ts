import { Types } from 'mongoose';
import { z } from 'zod';
import { Exercise } from './exercise.model';
import { ExerciseSubmission } from './submission.model';
import { Module } from '../modules-content/module.model';
import { AppError } from '../../common/errors/AppError';
import { getAiClient } from '../ai-guidance/ai.client';
import { EXERCISE_SYSTEM_PROMPT, buildExercisePrompt } from '../ai-guidance/prompts';
import { resolveOwnedLesson } from '../lessons/lesson.service';
import { lessonContentSummary } from '../lessons/lessonContent';
import { gradingQueue, jobPriority } from '../../jobs/queue';

export const GeneratedExerciseSchema = z
  .object({
    description: z.string().min(1).optional(),
    task: z.string().min(1).optional(),
    exercise: z
      .object({
        description: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        language: z.string().optional(),
      })
      .passthrough()
      .optional(),
    starterState: z.unknown().optional(),
    starter_state: z.unknown().optional(),
    rubric: z.unknown().optional(),
  })
  .passthrough()
  .transform((data) => {
    const nested = data.exercise;
    const description =
      data.description?.trim() ||
      nested?.description?.trim() ||
      data.task?.trim() ||
      nested?.title?.trim() ||
      '';

    const rawStarter = data.starterState ?? data.starter_state ?? {};
    const starterState =
      rawStarter && typeof rawStarter === 'object'
        ? {
            ...(rawStarter as Record<string, unknown>),
            ...(nested?.language ? { language: nested.language } : {}),
          }
        : rawStarter;

    return {
      description,
      starterState,
      rubric: data.rubric ?? {},
    };
  })
  .pipe(
    z.object({
      description: z.string().min(1),
      starterState: z.unknown().optional(),
      rubric: z.unknown().optional(),
    }),
  );
export type GeneratedExercise = z.infer<typeof GeneratedExerciseSchema>;

export type ExerciseGenerator = (input: {
  lessonTitle: string;
  lessonSummary: string;
  domain: string;
  userId: string;
}) => Promise<GeneratedExercise>;

const defaultExerciseGenerator: ExerciseGenerator = async ({
  lessonTitle,
  lessonSummary,
  domain,
  userId,
}) => {
  const result = await getAiClient().completeStructured(
    {
      system: EXERCISE_SYSTEM_PROMPT,
      prompt: buildExercisePrompt({ lessonTitle, lessonSummary, domain }),
      useCase: 'exercise',
      userId,
    },
    GeneratedExerciseSchema,
  );
  return result.data;
};

// Generates a NEW exercise for a lesson (§1.6). Domain is inherited from the Module.
export async function generateExercise(
  userId: string,
  lessonId: string,
  generate: ExerciseGenerator = defaultExerciseGenerator,
) {
  const { lesson } = await resolveOwnedLesson(userId, lessonId); // ownership BEFORE any AI call
  const mod = await Module.findById(lesson.moduleId);
  const domain = (mod?.domain as string | undefined) ?? 'general';
  const title = lesson.title as string;
  const generated = await generate({
    lessonTitle: title,
    lessonSummary: lessonContentSummary(lesson.content, title),
    domain,
    userId,
  });
  return Exercise.create({
    lessonId: lesson._id,
    userId,
    domain,
    taskSpec: {
      description: generated.description,
      starterState: generated.starterState ?? {},
      rubric: generated.rubric ?? {},
    },
  });
}

export async function getExercise(userId: string, exerciseId: string) {
  if (!Types.ObjectId.isValid(exerciseId)) throw new AppError(404, 'Exercise not found');
  const exercise = await Exercise.findOne({ _id: exerciseId, userId });
  if (!exercise) throw new AppError(404, 'Exercise not found');
  return exercise;
}

// For polling async grading status (§8 pending -> processing -> graded).
export async function getSubmission(userId: string, submissionId: string) {
  if (!Types.ObjectId.isValid(submissionId)) throw new AppError(404, 'Submission not found');
  const submission = await ExerciseSubmission.findOne({ _id: submissionId, userId });
  if (!submission) throw new AppError(404, 'Submission not found');
  return submission;
}

// Records the submission (status: submitted) and enqueues async grading (§8).
// Premium submissions are graded at a higher queue priority (§6).
export async function submitExercise(
  userId: string,
  exerciseId: string,
  submissionData: unknown,
  tier = 'free',
) {
  const exercise = await getExercise(userId, exerciseId); // ownership
  const submission = await ExerciseSubmission.create({
    exerciseId: exercise._id,
    userId,
    submissionData,
    status: 'submitted',
  });
  await gradingQueue().add(
    'grade',
    { submissionId: String(submission._id) },
    { priority: jobPriority(tier) },
  );
  return submission;
}
