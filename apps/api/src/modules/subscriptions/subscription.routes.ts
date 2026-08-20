import express, { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './subscription.controller';

const router = Router();

// Stripe posts here unauthenticated (the signature is the credential). Needs the
// raw body for signature verification — the global JSON parser skips this path.
router.post('/webhook', express.raw({ type: 'application/json' }), controller.webhook);

router.use(authenticate);
router.get('/me', controller.getMySubscription);
router.post('/checkout', controller.checkout);
router.post('/portal', controller.portal);

export default router;
