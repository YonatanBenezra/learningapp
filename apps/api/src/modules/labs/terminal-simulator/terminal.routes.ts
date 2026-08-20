import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../../middlewares/auth.middleware';
import { validate } from '../../../middlewares/validate.middleware';
import * as controller from './terminal.controller';

const commandSchema = z.object({
  command: z.string().max(1000),
  cwd: z.string().max(4096).optional(),
});

const router = Router();

router.use(authenticate);

router.post('/command', validate({ body: commandSchema }), controller.command);

export default router;
