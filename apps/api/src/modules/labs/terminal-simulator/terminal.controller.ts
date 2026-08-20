import { asyncHandler } from '../../../common/utils/asyncHandler';
import { runCommand, DEFAULT_CWD } from './terminal.sandbox';

export const command = asyncHandler(async (req, res) => {
  const result = runCommand({ cwd: req.body.cwd ?? DEFAULT_CWD }, req.body.command);
  res.json(result);
});
