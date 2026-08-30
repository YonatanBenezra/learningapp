import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.schema';

export type CheckoutInterval = 'monthly' | 'annual';

export type StripeCheckoutSession = {
  url: string;
};

export type StripePortalSession = {
  url: string;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

const STRIPE_API = 'https://api.stripe.com/v1';
const SIGNATURE_TOLERANCE_S = 300;

@Injectable()
export class StripeGateway {
  constructor(private readonly config: ConfigService<Env, true>) {}

  isConfigured(): boolean {
    return Boolean(this.secretKey() && this.webhookSecret());
  }

  priceId(interval: CheckoutInterval): string {
    const id =
      interval === 'annual'
        ? this.config.get('STRIPE_PRICE_ANNUAL', { infer: true })
        : this.config.get('STRIPE_PRICE_MONTHLY', { infer: true });
    if (!id) {
      throw new ServiceUnavailableException('Stripe prices are not configured');
    }
    return id;
  }

  async createCheckoutSession(input: {
    userId: string;
    email: string;
    customerId?: string | null;
    interval: CheckoutInterval;
    successUrl: string;
    cancelUrl: string;
  }): Promise<StripeCheckoutSession> {
    const params = new URLSearchParams({
      mode: 'subscription',
      client_reference_id: input.userId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      'line_items[0][price]': this.priceId(input.interval),
      'line_items[0][quantity]': '1',
      'metadata[userId]': input.userId,
      'subscription_data[metadata][userId]': input.userId,
    });
    if (input.customerId) {
      params.set('customer', input.customerId);
    } else {
      params.set('customer_email', input.email);
    }
    const session = await this.postForm('/checkout/sessions', params);
    if (typeof session.url !== 'string' || !session.url) {
      throw new ServiceUnavailableException('Stripe checkout did not return a URL');
    }
    return { url: session.url };
  }

  async createPortalSession(input: {
    customerId: string;
    returnUrl: string;
  }): Promise<StripePortalSession> {
    const params = new URLSearchParams({
      customer: input.customerId,
      return_url: input.returnUrl,
    });
    const session = await this.postForm('/billing_portal/sessions', params);
    if (typeof session.url !== 'string' || !session.url) {
      throw new ServiceUnavailableException('Stripe portal did not return a URL');
    }
    return { url: session.url };
  }

  constructEvent(rawBody: Buffer, signatureHeader: string): StripeEvent {
    const secret = this.webhookSecret();
    if (!secret) {
      throw new ServiceUnavailableException('Stripe webhook secret is not configured');
    }
    const parts = Object.fromEntries(
      signatureHeader.split(',').map((part) => {
        const [key, ...rest] = part.split('=');
        return [key.trim(), rest.join('=')];
      }),
    );
    const timestamp = Number(parts.t);
    const expected = parts.v1;
    if (!Number.isFinite(timestamp) || !expected) {
      throw new Error('Invalid Stripe-Signature header');
    }
    const age = Math.abs(Date.now() / 1000 - timestamp);
    if (age > SIGNATURE_TOLERANCE_S) {
      throw new Error('Stripe webhook timestamp is too old');
    }
    const signed = `${timestamp}.${rawBody.toString('utf8')}`;
    const digest = createHmac('sha256', secret).update(signed).digest('hex');
    const a = Buffer.from(digest, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error('Invalid Stripe webhook signature');
    }
    const parsed = JSON.parse(rawBody.toString('utf8')) as StripeEvent;
    if (!parsed?.id || !parsed.type || !parsed.data?.object) {
      throw new Error('Invalid Stripe event payload');
    }
    return parsed;
  }

  private secretKey(): string {
    return this.config.get('STRIPE_SECRET_KEY', { infer: true }) ?? '';
  }

  private webhookSecret(): string {
    return this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true }) ?? '';
  }

  private async postForm(
    path: string,
    params: URLSearchParams,
  ): Promise<Record<string, unknown>> {
    const key = this.secretKey();
    if (!key) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
    const response = await fetch(`${STRIPE_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const body = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const message =
        body && typeof body === 'object' && body.error
          ? JSON.stringify(body.error)
          : `Stripe request failed (${response.status})`;
      throw new ServiceUnavailableException(message);
    }
    return body;
  }
}

export function stripeSignatureHeader(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}
