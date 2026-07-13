import { Types } from 'mongoose';
import { z } from 'zod';
import { Exercise } from './exercise.model';
import { ExerciseSubmission } from './submission.model';
import { Module } from '../modules-content/module.model';
import { AppError } from '../../common/errors/AppError';
import { getAiClient } from '../ai-guidance/ai.client';
import { EXERCISE_SYSTEM_PROMPT, buildExercisePrompt } from '../ai-guidance/prompts';
import { resolveOwnedLesson } from '../lessons/lesson.service';
import { gradingQueue } from '../../jobs/queue';

export const GeneratedExerciseSchema = z.object({
  description: z.string().min(1),
  starterState: z.unknown().optional(),
  rubric: z.unknown().optional(),
});
export type GeneratedExercise = z.infer<typeof GeneratedExerciseSchema>;

export type ExerciseGenerator = (input: {
  lessonTitle: string;
  lessonSummary: string;
  domain: string;
  userId: string;
}) => Promise<GeneratedExercise>;

function summaryOf(content: unknown, fallback: string): string {
  if (content && typeof content === 'object' && 'summary' in content) {
    const s = (content as { summary?: unknown }).summary;
    if (typeof s === 'string') return s;
  }
  return fallback;
}

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
    lessonSummary: summaryOf(lesson.content, title),
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
export async function submitExercise(userId: string, exerciseId: string, submissionData: unknown) {
  const exercise = await getExercise(userId, exerciseId); // ownership
  const submission = await ExerciseSubmission.create({
    exerciseId: exercise._id,
    userId,
    submissionData,
    status: 'submitted',
  });
  await gradingQueue().add('grade', { submissionId: String(submission._id) });
  return submission;
}
