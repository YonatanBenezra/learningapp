import { env } from '../../config/env';

export interface OpenRouterModelOption {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
}

interface OpenRouterModelsResponse {
  data?: Array<{
    id: string;
    name?: string;
    description?: string;
    context_length?: number;
  }>;
}

let cachedModels: { expiresAt: number; models: OpenRouterModelOption[] } | null = null;
const CACHE_TTL_MS = 10 * 60_000;

export async function listOpenRouterModels(): Promise<OpenRouterModelOption[]> {
  if (cachedModels && cachedModels.expiresAt > Date.now()) {
    return cachedModels.models;
  }

  const headers: Record<string, string> = {};
  if (env.openRouterApiKey) headers.Authorization = `Bearer ${env.openRouterApiKey}`;

  const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
  if (!res.ok) {
    throw new Error(`OpenRouter models list failed (${res.status})`);
  }

  const body = (await res.json()) as OpenRouterModelsResponse;
  const models = (body.data ?? [])
    .filter((m) => Boolean(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name?.trim() || m.id,
      description: m.description,
      contextLength: m.context_length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  cachedModels = { models, expiresAt: Date.now() + CACHE_TTL_MS };
  return models;
}
