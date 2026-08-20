import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { submitExerciseSchema } from './exercise.validation';
import * as controller from './exercise.controller';

const router = Router();

router.use(authenticate);

// Static segment first so it isn't captured by `/:id`.
router.get('/submissions/:sid', controller.getSubmission);
router.get('/:id', controller.getExercise);
router.post('/:id/submit', validate({ body: submitExerciseSchema }), controller.submitExercise);

export default router;
