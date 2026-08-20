import { asyncHandler } from '../../common/utils/asyncHandler';
import * as service from './notification.service';

export const getMyNotifications = asyncHandler(async (req, res) => {
  res.json({ notifications: await service.listNotifications(req.user!.id) });
});
