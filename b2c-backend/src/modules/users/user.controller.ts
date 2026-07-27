import { asyncHandler } from '../../common/utils/asyncHandler';
import { AppError } from '../../common/errors/AppError';
import * as userService from './user.service';

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user!.id);
  res.json({ user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updatePreferences(req.user!.id, req.body);
  res.json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  res.json({ user });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'Avatar image is required');
  const user = await userService.uploadProfileAvatar(req.user!.id, req.file);
  res.json({ user });
});
