import { Router } from 'express';
import { optionalAuthenticate } from '../../middlewares/optionalAuth.middleware';
import * as controller from './course.controller';

const router = Router();

router.get('/', controller.listCurated);
router.get('/id/:courseId/structure', optionalAuthenticate, controller.getCuratedStructure);
router.get('/id/:courseId', optionalAuthenticate, controller.getCuratedById);
router.get('/lessons/:lessonId', optionalAuthenticate, controller.getCuratedLesson);
router.get('/:slug', controller.getCuratedBySlug);

export default router;
