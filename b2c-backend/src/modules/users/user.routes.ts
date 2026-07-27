import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { avatarUpload } from '../../middlewares/avatarUpload.middleware';
import { AppError } from '../../common/errors/AppError';
import { updatePreferencesSchema, updateProfileSchema } from './user.validation';
import { getMe, updateMe, updateProfile, uploadAvatar } from './user.controller';
import * as privacy from '../privacy/privacy.controller';

const router = Router();

function handleAvatarUpload(req: Request, res: Response, next: NextFunction) {
  avatarUpload.single('avatar')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(400, 'Image must be 5 MB or smaller'));
        return;
      }
      next(new AppError(400, err.message));
      return;
    }
    if (err instanceof Error) {
      next(new AppError(400, err.message));
      return;
    }
    next(err);
  });
}

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate({ body: updatePreferencesSchema }), updateMe);
router.patch('/me/profile', authenticate, validate({ body: updateProfileSchema }), updateProfile);
router.post('/me/avatar', authenticate, handleAvatarUpload, uploadAvatar);

// Data privacy (§12): GDPR export + soft-delete account.
router.get('/me/export', authenticate, privacy.exportMe);
router.delete('/me', authenticate, privacy.deleteMe);

export default router;
