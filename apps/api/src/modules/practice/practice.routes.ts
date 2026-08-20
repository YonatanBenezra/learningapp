import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { syncPracticeSchema } from '../problems/problem.validation';
import * as controller from '../problems/problem.controller';

const router = Router();

router.post('/sync', authenticate, validate({ body: syncPracticeSchema }), controller.sync);

export default router;
