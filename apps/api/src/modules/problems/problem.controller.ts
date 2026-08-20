import { asyncHandler } from '../../common/utils/asyncHandler';
import * as service from './problem.service';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listProblems({
    topic: req.query.topic as string | undefined,
    difficulty: req.query.difficulty as string | undefined,
  });
  res.json(result);
});

export const next = asyncHandler(async (req, res) => {
  const exclude = (req.query.exclude as string[] | undefined) ?? [];
  const result = await service.getNextProblem(exclude);
  res.json(result);
});

export const getBySlug = asyncHandler(async (req, res) => {
  const problem = await service.getProblemBySlug(req.params.slug);
  res.json({ problem });
});

export const submit = asyncHandler(async (req, res) => {
  const result = await service.submitProblem(req.params.slug, req.body, req.user?.id);
  res.status(201).json({ result });
});

export const sync = asyncHandler(async (req, res) => {
  const summary = await service.syncGuestPractice(req.user!.id, req.body);
  res.json({ summary });
});
