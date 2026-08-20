export type Tier = 'free' | 'standard' | 'premium';
export type Role = 'user' | 'admin' | 'instructor';

export interface User {
  id: string;
  email: string;
  role: Role;
  tier: Tier;
  name?: string;
  imageUrl?: string;
  address?: string;
  profession?: string;
  experience?: string;
  preferences: {
    visualsPreferred: boolean;
    dailyNotification: boolean;
    timezone?: string;
    aiModel?: string | null;
  };
  streak?: {
    current: number;
    lastActivityDate?: string | null;
  };
}
