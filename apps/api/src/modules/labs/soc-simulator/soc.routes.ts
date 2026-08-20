import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requirePremium } from '../../../middlewares/entitlement.middleware';
import { validate } from '../../../middlewares/validate.middleware';
import * as controller from './soc.controller';

const submitSchema = z.object({
  answers: z.array(z.object({ questionId: z.string().min(1), answer: z.string() })).min(1),
});

const router = Router();

router.use(authenticate);

router.get('/scenarios', controller.list);
router.get('/scenario/:id', controller.getOne);
router.post(
  '/scenario/:id/submit',
  requirePremium,
  validate({ body: submitSchema }),
  controller.submit,
);

export default router;
