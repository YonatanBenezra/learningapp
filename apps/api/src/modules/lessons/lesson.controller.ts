import { asyncHandler } from '../../common/utils/asyncHandler';
import * as lessonService from './lesson.service';

export const getLesson = asyncHandler(async (req, res) => {
  const data = await lessonService.getLesson(req.user!.id, req.params.id);
  res.json(data);
});

export const startLesson = asyncHandler(async (req, res) => {
  const progress = await lessonService.startLesson(req.user!.id, req.params.id);
  res.json({ progress });
});

export const completeLesson = asyncHandler(async (req, res) => {
  const result = await lessonService.completeLesson(req.user!.id, req.params.id);
  res.json(result);
});
