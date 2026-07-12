// Channel-agnostic notification interface (§10). Web phase: email only;
// push (FCM/APNs) added later without refactoring.
export type NotificationChannel = 'email' | 'push';

export async function sendNotification(
  _userId: string,
  _type: string,
  _channel: NotificationChannel = 'email',
): Promise<void> {
  // TODO: dispatch via the configured channel provider
}
