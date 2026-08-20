import { asyncHandler } from '../../common/utils/asyncHandler';
import * as exerciseService from './exercise.service';

// POST /lessons/:id/exercises — generate a hands-on exercise for a lesson.
export const generateForLesson = asyncHandler(async (req, res) => {
  const exercise = await exerciseService.generateExercise(req.user!.id, req.params.id);
  res.status(201).json({ exercise });
});

// GET /exercises/:id
export const getExercise = asyncHandler(async (req, res) => {
  const exercise = await exerciseService.getExercise(req.user!.id, req.params.id);
  res.json({ exercise });
});

// GET /exercises/submissions/:sid — poll grading status.
export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await exerciseService.getSubmission(req.user!.id, req.params.sid);
  res.json({ submission });
});

// POST /exercises/:id/submit — records the submission and enqueues async grading.
export const submitExercise = asyncHandler(async (req, res) => {
  const submission = await exerciseService.submitExercise(
    req.user!.id,
    req.params.id,
    req.body.submissionData,
    req.user!.tier,
  );
  res.status(202).json({ submission }); // 202 — grading runs asynchronously
});
