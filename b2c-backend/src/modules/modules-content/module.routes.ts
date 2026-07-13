import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { aiRateLimit } from '../../middlewares/rateLimit.middleware';
import { usageQuota } from '../../middlewares/usageQuota.middleware';
import * as examController from '../assessments/exam.controller';

const router = Router();

router.use(authenticate);

// Module-scoped exam generation (§1.7), rate-limited + quota-gated.
router.post('/:id/exam', aiRateLimit, usageQuota('exam'), examController.generateForModule);

export default router;
