import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { aiRateLimit } from '../../middlewares/rateLimit.middleware';
import { usageQuota } from '../../middlewares/usageQuota.middleware';
import { createCourseSchema } from './course.validation';
import * as controller from './course.controller';
import * as examController from '../assessments/exam.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  aiRateLimit,
  usageQuota('course'),
  validate({ body: createCourseSchema }),
  controller.createCourse,
);
router.get('/', controller.listCourses);
router.get('/:id', controller.getCourse);
router.get('/:id/structure', controller.getCourseStructure);
// Course-scoped exam generation (§1.7).
router.post('/:id/exam', aiRateLimit, usageQuota('exam'), examController.generateForCourse);

export default router;
