import { apiClient } from '@/src/infrastructure/apiClient';

export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type NotificationChannel = 'email' | 'push';

export interface AppNotification {
  id: string;
  type: string;
  channel: NotificationChannel;
  payload?: {
    subject?: string;
    body?: string;
  };
  status: NotificationStatus;
  sentAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export function getMyNotifications(): Promise<{ notifications: AppNotification[] }> {
  return apiClient<{ notifications: AppNotification[] }>('/notifications');
}
