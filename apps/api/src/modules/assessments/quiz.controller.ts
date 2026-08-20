import { asyncHandler } from '../../common/utils/asyncHandler';
import * as quizService from './quiz.service';

// POST /lessons/:id/quizzes — generate a fresh quiz for a lesson.
export const generateForLesson = asyncHandler(async (req, res) => {
  const quiz = await quizService.generateQuiz(req.user!.id, req.params.id);
  res.status(201).json({ quiz });
});

// GET /quizzes/mine — quiz submission history for the authenticated user.
export const listMine = asyncHandler(async (req, res) => {
  const submissions = await quizService.listMyQuizSubmissions(req.user!.id);
  res.json({ submissions });
});

// GET /quizzes/:id — fetch a quiz to take (answers stripped by toJSON).
export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.getQuiz(req.user!.id, req.params.id);
  res.json({ quiz });
});

// POST /quizzes/:id/submit — grade and return score + per-question results (with correct answers).
export const submitQuiz = asyncHandler(async (req, res) => {
  const submission = await quizService.submitQuiz(req.user!.id, req.params.id, req.body.answers);
  res.status(201).json({ submission });
});
