import { apiClient } from '@/src/infrastructure/apiClient';

export interface EarnedAchievement {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  earnedAt: string;
}

export interface MyAchievements {
  earnedCount: number;
  total: number;
  achievements: EarnedAchievement[];
}

export function getMyAchievements(): Promise<MyAchievements> {
  return apiClient<MyAchievements>('/gamification/me');
}

export interface CatalogAchievement {
  key: string;
  title: string;
  description?: string;
  icon?: string;
}

export function listAchievements(): Promise<{ achievements: CatalogAchievement[] }> {
  return apiClient<{ achievements: CatalogAchievement[] }>('/gamification/achievements');
}
