'use client';

import { useQuery } from '@tanstack/react-query';
import * as gamificationApi from './gamificationApi';

export function useMyAchievements() {
  return useQuery({ queryKey: ['gamification', 'me'], queryFn: gamificationApi.getMyAchievements });
}

export function useAchievementCatalog() {
  return useQuery({
    queryKey: ['gamification', 'catalog'],
    queryFn: gamificationApi.listAchievements,
  });
}
