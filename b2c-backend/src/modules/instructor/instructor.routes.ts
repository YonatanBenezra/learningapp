import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as controller from './instructor.controller';
import {
  createInstructorCourseSchema,
  updateInstructorCourseSchema,
} from './instructor.validation';

const router = Router();

router.use(authenticate, requireRole('instructor', 'admin'));

router.get('/dashboard', controller.getDashboard);
router.get('/courses', controller.listCourses);
router.post('/courses', validate({ body: createInstructorCourseSchema }), controller.createCourse);
router.get('/courses/:id', controller.getCourse);
router.patch('/courses/:id', validate({ body: updateInstructorCourseSchema }), controller.updateCourse);
router.post('/courses/:id/publish', controller.publishCourse);
router.post('/courses/:id/unpublish', controller.unpublishCourse);
router.get('/sales', controller.listSales);

export default router;
