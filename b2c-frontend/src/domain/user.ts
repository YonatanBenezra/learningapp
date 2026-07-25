export type Tier = 'free' | 'standard' | 'premium';
export type Role = 'user' | 'admin' | 'instructor';

export interface User {
  id: string;
  email: string;
  role: Role;
  tier: Tier;
  preferences: {
    visualsPreferred: boolean;
    dailyNotification: boolean;
    timezone?: string;
  };
  streak?: {
    current: number;
    lastActivityDate?: string | null;
  };
}
