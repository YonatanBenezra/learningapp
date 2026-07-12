import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updatePreferencesSchema } from './user.validation';
import { getMe, updateMe } from './user.controller';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate({ body: updatePreferencesSchema }), updateMe);

export default router;
