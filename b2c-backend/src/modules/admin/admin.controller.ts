import { asyncHandler } from '../../common/utils/asyncHandler';
import * as service from './admin.service';

export const getCosts = asyncHandler(async (_req, res) => {
  res.json(await service.getCostDashboard());
});

export const getMetrics = asyncHandler(async (_req, res) => {
  res.json(await service.getPlatformMetrics());
});

export const listContent = asyncHandler(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  res.json(await service.listContent(req.params.type, { page, limit }));
});

export const flagContent = asyncHandler(async (req, res) => {
  const flag = await service.flagContent(
    req.params.type,
    req.params.id,
    req.body.reason,
    req.user!.id,
  );
  res.status(201).json({ flag });
});

export const listFlags = asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  res.json({ flags: await service.listFlags(status) });
});

export const resolveFlag = asyncHandler(async (req, res) => {
  const flag = await service.resolveFlag(req.params.id, req.body.resolution);
  res.json({ flag });
});

export const regenerateContent = asyncHandler(async (req, res) => {
  res.status(202).json(await service.regenerateContent(req.params.type, req.params.id));
});

export const upsertAchievement = asyncHandler(async (req, res) => {
  const achievement = await service.upsertAchievement(req.body);
  res.status(201).json({ achievement });
});
