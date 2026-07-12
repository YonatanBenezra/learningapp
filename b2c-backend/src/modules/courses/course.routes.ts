import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCourseSchema } from './course.validation';
import * as controller from './course.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createCourseSchema }), controller.createCourse);
router.get('/', controller.listCourses);
router.get('/:id', controller.getCourse);
router.get('/:id/structure', controller.getCourseStructure);

export default router;
