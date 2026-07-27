import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from '../instructor/instructor.controller';

const router = Router();

router.get('/courses', controller.listMarketplaceCourses);
router.get('/courses/:id', controller.getMarketplaceCourse);
router.post('/courses/:id/purchase', authenticate, controller.purchaseCourse);

export default router;
