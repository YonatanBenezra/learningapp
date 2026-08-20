import { asyncHandler } from '../../../common/utils/asyncHandler';
import * as service from './network.service';

export const list = asyncHandler(async (_req, res) => {
  res.json({ scenarios: service.listScenarios() });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ scenario: service.getScenario(req.params.id) });
});

export const submit = asyncHandler(async (req, res) => {
  res.json({ result: service.submitScenario(req.params.id, req.body.answers) });
});
