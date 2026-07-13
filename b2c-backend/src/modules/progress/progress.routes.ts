import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './progress.controller';

const router = Router();

router.use(authenticate);

router.get('/', controller.listProgress);

export default router;
