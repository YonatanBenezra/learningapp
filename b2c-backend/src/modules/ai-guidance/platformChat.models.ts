export interface PlatformChatModelOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

/** Curated models allowed for public landing-page chat. */
export const PLATFORM_CHAT_MODELS: PlatformChatModelOption[] = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', shortLabel: 'Mini', description: 'Fast & efficient' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', shortLabel: 'GPT-4o', description: 'Balanced quality' },
  { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', shortLabel: 'Sonnet', description: 'Strong reasoning' },
  { id: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5', shortLabel: 'Haiku', description: 'Lightweight' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', shortLabel: 'Flash', description: 'Quick answers' },
];

export const DEFAULT_PLATFORM_CHAT_MODEL = PLATFORM_CHAT_MODELS[0].id;

/** Older UI / localStorage slugs that OpenRouter no longer accepts. */
const LEGACY_PLATFORM_CHAT_MODELS: Record<string, string> = {
  'anthropic/claude-haiku-4': 'anthropic/claude-haiku-4.5',
  'google/gemini-2.0-flash-001': 'google/gemini-2.5-flash',
};

const ALLOWED = new Set(PLATFORM_CHAT_MODELS.map((m) => m.id));

export function isAllowedPlatformChatModel(model: string): boolean {
  return ALLOWED.has(model) || model in LEGACY_PLATFORM_CHAT_MODELS;
}

export function resolvePlatformChatModel(model?: string | null): string {
  const trimmed = model?.trim();
  if (!trimmed) return DEFAULT_PLATFORM_CHAT_MODEL;
  if (ALLOWED.has(trimmed)) return trimmed;
  const aliased = LEGACY_PLATFORM_CHAT_MODELS[trimmed];
  if (aliased && ALLOWED.has(aliased)) return aliased;
  return DEFAULT_PLATFORM_CHAT_MODEL;
}

export function listPlatformChatModels(): PlatformChatModelOption[] {
  return PLATFORM_CHAT_MODELS;
}
