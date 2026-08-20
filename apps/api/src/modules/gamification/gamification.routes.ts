import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './gamification.controller';

const router = Router();

router.use(authenticate);

router.get('/achievements', controller.getAchievements); // full catalog
router.get('/me', controller.getMe); // the user's earned achievements + progress

export default router;
