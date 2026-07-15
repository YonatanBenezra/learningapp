import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updatePreferencesSchema } from './user.validation';
import { getMe, updateMe } from './user.controller';
import * as privacy from '../privacy/privacy.controller';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate({ body: updatePreferencesSchema }), updateMe);

// Data privacy (§12): GDPR export + soft-delete account.
router.get('/me/export', authenticate, privacy.exportMe);
router.delete('/me', authenticate, privacy.deleteMe);

export default router;
