import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as controller from './instructor.controller';
import {
  createInstructorCourseSchema,
  reorderStructureSchema,
  updateInstructorCourseSchema,
  updateStructureTitleSchema,
  updateLessonContentSchema,
} from './instructor.validation';

const router = Router();

router.use(authenticate, requireRole('instructor', 'admin'));

router.get('/dashboard', controller.getDashboard);
router.get('/courses', controller.listCourses);
router.post('/courses', validate({ body: createInstructorCourseSchema }), controller.createCourse);
router.get('/sales', controller.listSales);

// Structure management — register before /courses/:id so paths are never shadowed.
router.patch(
  '/courses/:courseId/structure/order',
  validate({ body: reorderStructureSchema }),
  controller.reorderStructure,
);
router.patch(
  '/courses/:courseId/modules/:moduleId',
  validate({ body: updateStructureTitleSchema }),
  controller.updateModuleTitle,
);
router.delete('/courses/:courseId/modules/:moduleId', controller.deleteModule);
router.patch(
  '/courses/:courseId/lessons/:lessonId',
  validate({ body: updateStructureTitleSchema }),
  controller.updateLessonTitle,
);
router.patch(
  '/courses/:courseId/lessons/:lessonId/content',
  validate({ body: updateLessonContentSchema }),
  controller.updateLessonContent,
);
router.delete('/courses/:courseId/lessons/:lessonId', controller.deleteLesson);

router.get('/courses/:id', controller.getCourse);
router.patch('/courses/:id', validate({ body: updateInstructorCourseSchema }), controller.updateCourse);
router.post('/courses/:id/publish', controller.publishCourse);
router.post('/courses/:id/unpublish', controller.unpublishCourse);
router.delete('/courses/:id', controller.deleteCourse);

export default router;
