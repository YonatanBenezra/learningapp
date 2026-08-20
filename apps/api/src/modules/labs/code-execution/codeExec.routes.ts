import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../../middlewares/auth.middleware';
import { requirePlatformAccess, requirePremium } from '../../../middlewares/entitlement.middleware';
import { validate } from '../../../middlewares/validate.middleware';
import { aiRateLimit } from '../../../middlewares/rateLimit.middleware';
import * as controller from './codeExec.controller';

const executeSchema = z.object({
  language: z.enum(['javascript', 'python', 'shell']),
  code: z.string().min(1).max(100_000),
  stdin: z.string().max(10_000).optional(),
});

const router = Router();

router.use(authenticate);

// Untrusted code execution (§2.1). Burst-limited; per-day lab caps + sandbox
// isolation are enforced inside executeCode.
router.post(
  '/execute',
  requirePlatformAccess,
  aiRateLimit,
  validate({ body: executeSchema }),
  controller.execute,
);

export default router;
