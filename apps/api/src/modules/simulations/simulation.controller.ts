import { asyncHandler } from '../../common/utils/asyncHandler';
import * as service from './simulation.service';

export const list = asyncHandler(async (_req, res) => {
  const result = await service.listSimulations();
  res.json(result);
});

export const getBySlug = asyncHandler(async (req, res) => {
  const simulation = await service.getSimulationBySlug(req.params.slug);
  const bootstrap = await service.getSimulationBootstrap(req.params.slug);
  res.json({ simulation, bootstrap });
});

export const run = asyncHandler(async (req, res) => {
  const result = await service.runSimulation(req.params.slug, req.body, {
    userId: req.user?.id,
    guestSessionId: req.body.guestSessionId,
  });
  res.json({ result });
});

export const submit = asyncHandler(async (req, res) => {
  const result = await service.submitSimulation(req.params.slug, req.body, {
    userId: req.user?.id,
    guestSessionId: req.body.guestSessionId,
  });
  res.status(201).json({ result });
});
