import { asyncHandler } from '../../common/utils/asyncHandler';
import type { Role } from '../../common/types';
import * as service from './admin.service';

export const getCosts = asyncHandler(async (_req, res) => {
  res.json(await service.getCostDashboard());
});

export const getMetrics = asyncHandler(async (_req, res) => {
  res.json(await service.getPlatformMetrics());
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const role = typeof req.query.role === 'string' ? (req.query.role as Role) : undefined;
  const tier = typeof req.query.tier === 'string' ? req.query.tier : undefined;
  res.json(await service.listUsers({ page, limit, search, role, tier }));
});

export const getSubscriptions = asyncHandler(async (_req, res) => {
  res.json(await service.getSubscriptionDashboard());
});

export const getAssessments = asyncHandler(async (_req, res) => {
  res.json(await service.getAssessmentDashboard());
});

export const getMarketplace = asyncHandler(async (_req, res) => {
  res.json(await service.getMarketplaceDashboard());
});

export const getMarketplaceCourse = asyncHandler(async (req, res) => {
  res.json(await service.getMarketplaceCourseDetail(req.params.id));
});

export const getSystem = asyncHandler(async (_req, res) => {
  res.json(await service.getSystemDashboard());
});

export const getActivity = asyncHandler(async (_req, res) => {
  res.json(await service.getActivityDashboard());
});

export const listAchievements = asyncHandler(async (_req, res) => {
  res.json({ achievements: await service.listAchievements() });
});

export const listAdminNotifications = asyncHandler(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  res.json(await service.listAdminNotifications({ page, limit }));
});

export const broadcastNotification = asyncHandler(async (req, res) => {
  res.status(201).json(await service.broadcastNotification(req.body));
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

export const setUserRole = asyncHandler(async (req, res) => {
  const user = await service.setUserRole(req.params.id, req.body.role);
  res.json({ user });
});
