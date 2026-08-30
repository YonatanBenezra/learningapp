import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/env.schema';
import { StripeGateway, stripeSignatureHeader } from './stripe.gateway';

const SECRET = 'whsec_test_gateway';

function gateway() {
  return new StripeGateway({
    get: (key: string) => {
      const values: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_x',
        STRIPE_WEBHOOK_SECRET: SECRET,
        STRIPE_PRICE_MONTHLY: 'price_m',
        STRIPE_PRICE_ANNUAL: 'price_a',
      };
      return values[key] ?? '';
    },
  } as ConfigService<Env, true>);
}

describe('StripeGateway.constructEvent', () => {
  const payload = JSON.stringify({
    id: 'evt_1',
    type: 'customer.subscription.updated',
    data: { object: { id: 'sub_1', status: 'active' } },
  });

  it('accepts a valid signature', () => {
    const event = gateway().constructEvent(
      Buffer.from(payload),
      stripeSignatureHeader(payload, SECRET),
    );
    expect(event.id).toBe('evt_1');
    expect(event.type).toBe('customer.subscription.updated');
  });

  it('rejects a tampered signature', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(() =>
      gateway().constructEvent(
        Buffer.from(payload),
        `t=${now},v1=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef`,
      ),
    ).toThrow(/signature/i);
  });
});
