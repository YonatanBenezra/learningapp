import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { optionalAuthenticate } from '../../middlewares/optionalAuth.middleware';
import { aiRateLimit } from '../../middlewares/rateLimit.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  generateSkillAssessmentSchema,
  submitSkillAssessmentSchema,
  listSkillAssessmentsQuerySchema,
  skillAssessmentResultQuerySchema,
} from './skillAssessment.validation';
import * as controller from './skillAssessment.controller';

const router = Router();

router.get('/topics', controller.listTopics);

router.get(
  '/mine',
  optionalAuthenticate,
  validate({ query: listSkillAssessmentsQuerySchema }),
  controller.listMine,
);

router.post(
  '/generate',
  optionalAuthenticate,
  aiRateLimit,
  validate({ body: generateSkillAssessmentSchema }),
  controller.generate,
);

router.post(
  '/diagnostic',
  optionalAuthenticate,
  validate({ body: generateSkillAssessmentSchema }),
  controller.startDiagnostic,
);

router.get('/:id', controller.getAssessment);

router.post(
  '/:id/submit',
  optionalAuthenticate,
  validate({ body: submitSkillAssessmentSchema }),
  controller.submit,
);

router.get(
  '/:id/result',
  optionalAuthenticate,
  validate({ query: skillAssessmentResultQuerySchema }),
  controller.getResult,
);

export default router;
