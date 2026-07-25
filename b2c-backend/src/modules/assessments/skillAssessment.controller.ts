import { asyncHandler } from '../../common/utils/asyncHandler';
import { User } from '../users/user.model';
import { SKILL_TOPICS } from './skillAssessment.constants';
import * as service from './skillAssessment.service';

async function resolveRequestTier(userId?: string, tokenTier?: string | null): Promise<string> {
  if (!userId) return 'free';
  const user = await User.findById(userId).select('tier').lean();
  return user?.tier ?? tokenTier ?? 'free';
}

export const listTopics = asyncHandler(async (_req, res) => {
  res.json({ topics: SKILL_TOPICS });
});

export const generate = asyncHandler(async (req, res) => {
  const tier = await resolveRequestTier(req.user?.id, req.user?.tier);
  const assessment = await service.generateSkillAssessment(req.body, req.user?.id, tier);
  res.status(202).json({ assessment });
});

export const listMine = asyncHandler(async (req, res) => {
  const guestSessionId = req.query.guestSessionId as string | undefined;
  const tier = await resolveRequestTier(req.user?.id, req.user?.tier);
  const result = await service.listSkillAssessments(
    req.user?.id,
    guestSessionId,
    tier,
  );
  res.json(result);
});

export const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await service.getSkillAssessment(req.params.id);
  res.json({ assessment });
});

export const submit = asyncHandler(async (req, res) => {
  const submission = await service.submitSkillAssessment(
    req.user!.id,
    req.params.id,
    req.body.answers,
  );
  res.status(201).json({ submission });
});

export const getResult = asyncHandler(async (req, res) => {
  const submission = await service.getSkillAssessmentResult(req.user!.id, req.params.id);
  res.json({ submission });
});
