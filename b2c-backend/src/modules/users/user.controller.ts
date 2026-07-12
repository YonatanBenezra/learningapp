import { asyncHandler } from '../../common/utils/asyncHandler';
import * as userService from './user.service';

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user!.id);
  res.json({ user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updatePreferences(req.user!.id, req.body);
  res.json({ user });
});
