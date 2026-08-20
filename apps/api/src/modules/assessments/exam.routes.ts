import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { submitSchema } from './assessment.validation';
import * as controller from './exam.controller';

const router = Router();

router.use(authenticate);

router.get('/mine', controller.listMine);
router.get('/:id', controller.getExam);
router.post('/:id/submit', validate({ body: submitSchema }), controller.submitExam);

export default router;
