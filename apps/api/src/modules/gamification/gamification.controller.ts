import { asyncHandler } from '../../common/utils/asyncHandler';
import * as service from './gamification.service';

export const getAchievements = asyncHandler(async (_req, res) => {
  res.json({ achievements: await service.listAchievements() });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(await service.getMyAchievements(req.user!.id));
});
