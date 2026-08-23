import { Router } from 'express';
import { optionalAuthenticate } from '../../middlewares/optionalAuth.middleware';
import { rateLimit } from '../../middlewares/rateLimit.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { listSimulationsQuerySchema, simulationActionBodySchema } from './simulation.validation';
import * as controller from './simulation.controller';

const router = Router();

const simRunLimit = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyPrefix: 'simulation-run',
});

router.get('/', validate({ query: listSimulationsQuerySchema }), controller.list);

router.get('/:slug', controller.getBySlug);

router.post(
  '/:slug/run',
  optionalAuthenticate,
  simRunLimit,
  validate({ body: simulationActionBodySchema }),
  controller.run,
);

router.post(
  '/:slug/submit',
  optionalAuthenticate,
  simRunLimit,
  validate({ body: simulationActionBodySchema }),
  controller.submit,
);

export default router;
