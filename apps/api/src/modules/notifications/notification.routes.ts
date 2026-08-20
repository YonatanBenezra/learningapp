import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './notification.controller';

const router = Router();

router.use(authenticate);

// Notification history for the current user (preferences are managed via PATCH /users/me).
router.get('/', controller.getMyNotifications);

export default router;
