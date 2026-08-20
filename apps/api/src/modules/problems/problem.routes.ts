import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { optionalAuthenticate } from '../../middlewares/optionalAuth.middleware';
import { rateLimit } from '../../middlewares/rateLimit.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  listProblemsQuerySchema,
  nextProblemQuerySchema,
  submitProblemSchema,
} from './problem.validation';
import * as controller from './problem.controller';

const router = Router();

const guestSubmitLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyPrefix: 'practice-submit',
});

router.get('/', validate({ query: listProblemsQuerySchema }), controller.list);

router.get('/next', validate({ query: nextProblemQuerySchema }), controller.next);

router.get('/:slug', controller.getBySlug);

router.post(
  '/:slug/submit',
  optionalAuthenticate,
  guestSubmitLimit,
  validate({ body: submitProblemSchema }),
  controller.submit,
);

export default router;
