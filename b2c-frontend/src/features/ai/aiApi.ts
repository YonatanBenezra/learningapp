import { apiClient } from '@/src/infrastructure/apiClient';

export interface OpenRouterModelOption {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
}

export function listAiModels(): Promise<{ models: OpenRouterModelOption[] }> {
  return apiClient<{ models: OpenRouterModelOption[] }>('/ai/models');
}
