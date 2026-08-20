import { asyncHandler } from '../../common/utils/asyncHandler';
import * as progressService from './progress.service';

export const listProgress = asyncHandler(async (req, res) => {
  const courseId = typeof req.query.courseId === 'string' ? req.query.courseId : undefined;
  const progress = await progressService.listProgress(req.user!.id, courseId);
  res.json({ progress });
});
