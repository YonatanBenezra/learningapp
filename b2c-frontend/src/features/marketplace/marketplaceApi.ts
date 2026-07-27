import { apiClient } from '@/src/infrastructure/apiClient';
import type {
  MarketplaceCourse,
  MarketplaceCourseDetailResponse,
} from '@/src/domain/marketplace';

export function listMarketplaceCourses(): Promise<{ courses: MarketplaceCourse[] }> {
  return apiClient<{ courses: MarketplaceCourse[] }>('/marketplace/courses');
}

export function getMarketplaceCourse(id: string): Promise<MarketplaceCourseDetailResponse> {
  return apiClient<MarketplaceCourseDetailResponse>(`/marketplace/courses/${id}`);
}

export function purchaseMarketplaceCourse(id: string): Promise<{ sale: { id: string } }> {
  return apiClient<{ sale: { id: string } }>(`/marketplace/courses/${id}/purchase`, {
    method: 'POST',
  });
}
