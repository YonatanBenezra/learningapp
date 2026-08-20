import { z } from 'zod';
import { getAiClient } from '../ai-guidance/ai.client';
import { Exercise } from './exercise.model';
import { ExerciseSubmission } from './submission.model';
import { logger } from '../../common/utils/logger';

export interface ExerciseEvaluation {
  score: number;
  feedback: string;
}

export type SubmissionEvaluator = (
  taskSpec: { description?: string; rubric?: unknown },
  submissionData: unknown,
) => Promise<ExerciseEvaluation>;

const EvaluationSchema = z
  .object({
    score: z.union([z.number(), z.string()]).optional(),
    feedback: z.string().optional(),
    comment: z.string().optional(),
  })
  .passthrough()
  .transform((data) => {
    const rawScore = data.score;
    const score =
      typeof rawScore === 'number'
        ? rawScore
        : typeof rawScore === 'string'
          ? Number.parseFloat(rawScore)
          : Number.NaN;
    return {
      score,
      feedback: (data.feedback ?? data.comment ?? 'Graded.').trim(),
    };
  })
  .pipe(
    z.object({
      score: z.number().min(0).max(100),
      feedback: z.string().min(1),
    }),
  );

// Default AI evaluator (§1.6). Injectable so tests avoid the provider.
// (Domain-specific execution — running code, matching SOC/network answers — plugs in at §9.)
export const evaluateSubmission: SubmissionEvaluator = async (taskSpec, submissionData) => {
  const result = await getAiClient().completeStructured(
    {
      system:
        'You grade a hands-on exercise submission against its task description and rubric. ' +
        'Return a score from 0 to 100 and concise, actionable feedback.',
      prompt: `Task: ${taskSpec.description ?? ''}\nRubric: ${JSON.stringify(taskSpec.rubric ?? {})}\nSubmission: ${JSON.stringify(submissionData ?? {})}`,
      useCase: 'grading',
    },
    EvaluationSchema,
  );
  return result.data;
};

// Worker logic (§8): submitted -> grading -> graded. Idempotent (a non-submitted
// submission is left untouched); the evaluator is injectable for tests.
export async function gradeExerciseSubmission(
  submissionId: string,
  evaluate: SubmissionEvaluator = evaluateSubmission,
): Promise<void> {
  const submission = await ExerciseSubmission.findById(submissionId);
  if (!submission || submission.status !== 'submitted') return;

  submission.status = 'grading';
  await submission.save();

  try {
    const exercise = await Exercise.findById(submission.exerciseId);
    if (!exercise) throw new Error('Exercise not found');
    const taskSpec = exercise.taskSpec as { description?: string; rubric?: unknown };
    const { score, feedback } = await evaluate(taskSpec, submission.submissionData);
    submission.score = score;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    await submission.save();
    logger.info({ submissionId, score }, 'Exercise graded');
  } catch (err) {
    submission.status = 'graded';
    submission.score = null;
    submission.feedback = err instanceof Error ? `Grading failed: ${err.message}` : 'Grading failed';
    submission.gradedAt = new Date();
    await submission.save();
    logger.error({ err, submissionId }, 'Exercise grading failed');
  }
}
