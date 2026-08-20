import { asyncHandler } from '../../../common/utils/asyncHandler';
import { executeCode } from './codeExec.sandbox';

export const execute = asyncHandler(async (req, res) => {
  const result = await executeCode(req.user!.id, req.user!.tier, {
    language: req.body.language,
    code: req.body.code,
    stdin: req.body.stdin,
  });
  res.json({ result });
});
