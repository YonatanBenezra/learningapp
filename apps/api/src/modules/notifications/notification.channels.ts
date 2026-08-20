import { env } from '../../config/env';
import { logger } from '../../common/utils/logger';

export type NotificationChannel = 'email' | 'push';

export interface OutboundMessage {
  to: string;
  subject: string;
  body: string;
}

// A delivery channel. New channels (push, SMS, …) implement this and slot into
// getChannel with no changes to the notification service (§10).
export interface NotificationChannelAdapter {
  send(msg: OutboundMessage): Promise<void>;
}

// Email adapter. The concrete SendGrid/Postmark HTTP call is a provider seam:
// with no EMAIL_PROVIDER_API_KEY configured it logs instead of sending, so dev/test
// never make network calls and production wires the real provider here.
export class EmailChannel implements NotificationChannelAdapter {
  async send(msg: OutboundMessage): Promise<void> {
    if (!env.emailProviderApiKey) {
      logger.warn(
        { to: msg.to, subject: msg.subject },
        'Email provider not configured — send skipped',
      );
      return;
    }
    // TODO(provider): POST to SendGrid/Postmark with env.emailProviderApiKey.
    logger.info({ to: msg.to, subject: msg.subject }, 'Email dispatched');
  }
}

// Push is deferred to the mobile phase — it logs rather than throwing so switching
// `channel` to 'push' routes cleanly without breaking callers.
export class PushChannel implements NotificationChannelAdapter {
  async send(msg: OutboundMessage): Promise<void> {
    logger.info({ to: msg.to }, 'Push channel not implemented yet (deferred to mobile phase)');
  }
}

export function getChannel(channel: NotificationChannel): NotificationChannelAdapter {
  return channel === 'push' ? new PushChannel() : new EmailChannel();
}
