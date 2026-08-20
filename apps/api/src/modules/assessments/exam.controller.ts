import { asyncHandler } from '../../common/utils/asyncHandler';
import * as examService from './exam.service';

// POST /modules/:id/exam — generate a module-scoped exam.
export const generateForModule = asyncHandler(async (req, res) => {
  const exam = await examService.generateModuleExam(req.user!.id, req.params.id);
  res.status(201).json({ exam });
});

// POST /courses/:id/exam — generate a course-scoped exam.
export const generateForCourse = asyncHandler(async (req, res) => {
  const exam = await examService.generateCourseExam(req.user!.id, req.params.id);
  res.status(201).json({ exam });
});

// GET /exams/mine — exam submission history for the authenticated user.
export const listMine = asyncHandler(async (req, res) => {
  const submissions = await examService.listMyExamSubmissions(req.user!.id);
  res.json({ submissions });
});

// GET /exams/:id — fetch an exam to take (answers stripped by toJSON).
export const getExam = asyncHandler(async (req, res) => {
  const exam = await examService.getExam(req.user!.id, req.params.id);
  res.json({ exam });
});

// POST /exams/:id/submit — grade and return score + per-question results.
export const submitExam = asyncHandler(async (req, res) => {
  const submission = await examService.submitExam(req.user!.id, req.params.id, req.body.answers);
  res.status(201).json({ submission });
});
