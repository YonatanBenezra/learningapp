import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { aiRateLimit } from '../../middlewares/rateLimit.middleware';
import { usageQuota } from '../../middlewares/usageQuota.middleware';
import * as controller from './lesson.controller';
import * as quizController from '../assessments/quiz.controller';
import * as exerciseController from '../exercises/exercise.controller';

const router = Router();

router.use(authenticate);

router.get('/:id', controller.getLesson);
router.post('/:id/start', controller.startLesson);
router.post('/:id/complete', controller.completeLesson);
// Assessment + exercise generation are nested under the lesson (§1.5), rate-limited + quota-gated.
router.post('/:id/quizzes', aiRateLimit, usageQuota('quiz'), quizController.generateForLesson);
router.post(
  '/:id/exercises',
  aiRateLimit,
  usageQuota('exercise'),
  exerciseController.generateForLesson,
);

export default router;
