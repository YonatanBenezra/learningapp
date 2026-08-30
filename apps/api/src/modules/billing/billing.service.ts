import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountTier, SubscriptionStatus } from '@prisma/client';
import type { Env } from '../../core/config/env.schema';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AccountService } from '../accounts/account.service';
import {
  StripeGateway,
  type CheckoutInterval,
  type StripeEvent,
} from './stripe.gateway';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly stripe: StripeGateway,
    private readonly accounts: AccountService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async createCheckout(
    userId: string,
    email: string,
    interval: CheckoutInterval,
  ): Promise<{ url: string }> {
    this.requireStripe();
    const account = await this.accounts.ensureAccount(userId);
    if (
      account.tier === AccountTier.pro &&
      account.subscriptionStatus === SubscriptionStatus.active
    ) {
      throw new ConflictException('This account already has an active Pro plan');
    }
    const web = this.webUrl();
    return this.stripe.createCheckoutSession({
      userId,
      email,
      customerId: account.stripeCustomerId,
      interval,
      successUrl: `${web}/billing?status=success`,
      cancelUrl: `${web}/billing?status=cancel`,
    });
  }

  async createPortal(userId: string): Promise<{ url: string }> {
    this.requireStripe();
    const account = await this.accounts.ensureAccount(userId);
    if (!account.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer on this account');
    }
    return this.stripe.createPortalSession({
      customerId: account.stripeCustomerId,
      returnUrl: `${this.webUrl()}/billing`,
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new UnauthorizedException('Missing Stripe-Signature');
    }
    let event: StripeEvent;
    try {
      event = this.stripe.constructEvent(rawBody, signature);
    } catch (caught: unknown) {
      if (caught instanceof ServiceUnavailableException) {
        throw caught;
      }
      this.logger.warn(
        caught instanceof Error ? caught.message : 'Invalid Stripe webhook',
      );
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }
    await this.applyEvent(event);
    return { received: true };
  }

  private async applyEvent(event: StripeEvent): Promise<void> {
    const object = event.data.object;
    if (event.type === 'checkout.session.completed') {
      await this.accounts.applyStripeSubscription({
        userId: stringField(object, 'client_reference_id') ?? metadataUserId(object),
        customerId: stringField(object, 'customer'),
        subscriptionId: stringField(object, 'subscription'),
        stripeStatus: 'active',
      });
      return;
    }
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      await this.accounts.applyStripeSubscription({
        userId: metadataUserId(object),
        customerId: stringField(object, 'customer'),
        subscriptionId: stringField(object, 'id'),
        stripeStatus: stringField(object, 'status') ?? 'expired',
      });
      return;
    }
    if (event.type === 'customer.subscription.deleted') {
      await this.accounts.applyStripeSubscription({
        userId: metadataUserId(object),
        customerId: stringField(object, 'customer'),
        subscriptionId: stringField(object, 'id'),
        stripeStatus: 'canceled',
      });
    }
  }

  private requireStripe() {
    if (!this.stripe.isConfigured()) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
  }

  private webUrl(): string {
    return this.config.get('PUBLIC_WEB_URL', { infer: true }).replace(/\/$/, '');
  }
}

function metadataUserId(object: Record<string, unknown>): string | null {
  const metadata = object.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  const userId = (metadata as Record<string, unknown>).userId;
  return typeof userId === 'string' && userId ? userId : null;
}

function stringField(
  object: Record<string, unknown>,
  key: string,
): string | null {
  const value = object[key];
  return typeof value === 'string' && value ? value : null;
}
