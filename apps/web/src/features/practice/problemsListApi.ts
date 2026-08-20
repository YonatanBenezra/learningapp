import { apiClient } from '@/src/infrastructure/apiClient';

export async function fetchProblems(filters?: {
  topic?: string;
  difficulty?: string;
}): Promise<import('./practiceApi').ProblemPublic[]> {
  const params = new URLSearchParams();
  if (filters?.topic) params.set('topic', filters.topic);
  if (filters?.difficulty) params.set('difficulty', filters.difficulty);
  const qs = params.toString();
  const data = await apiClient<{ problems: import('./practiceApi').ProblemPublic[] }>(
    `/problems${qs ? `?${qs}` : ''}`,
  );
  return data.problems;
}
