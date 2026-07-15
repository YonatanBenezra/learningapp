import { asyncHandler } from '../../common/utils/asyncHandler';
import * as service from './privacy.service';

export const exportMe = asyncHandler(async (req, res) => {
  res.json(await service.exportUserData(req.user!.id));
});

export const deleteMe = asyncHandler(async (req, res) => {
  await service.softDeleteUser(req.user!.id);
  res.status(200).json({
    status: 'deleted',
    message: 'Account deactivated. Your data will be permanently purged after the retention window.',
  });
});
