import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { submitSchema } from './assessment.validation';
import * as controller from './quiz.controller';

const router = Router();

router.use(authenticate);

router.get('/:id', controller.getQuiz);
router.post('/:id/submit', validate({ body: submitSchema }), controller.submitQuiz);

export default router;
