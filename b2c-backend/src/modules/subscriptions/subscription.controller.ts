import type { Request, Response, NextFunction } from 'express';
import { getBillingProvider } from './billing/stripe.provider';
import * as service from './subscription.service';

export async function getMySubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subscription = await service.getOrCreateSubscription(req.user!.id);
    res.json({ subscription: service.serializeSubscription(subscription) });
  } catch (err) {
    next(err);
  }
}

export async function checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plan = req.body?.plan === 'standard' ? 'standard' : 'premium';
    const { url } = await service.createCheckout(req.user!.id, getBillingProvider(), plan);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

export async function portal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url } = await service.createPortal(req.user!.id);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// Unauthenticated Stripe callback — the signature is the credential.
export async function webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers['stripe-signature'];
    const signature = Array.isArray(header) ? header[0] : (header ?? '');
    await service.processStripeWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
