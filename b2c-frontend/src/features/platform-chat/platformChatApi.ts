import { apiClient } from '@/src/infrastructure/apiClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PlatformChatModelOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

export function listPlatformChatModels(): Promise<{ models: PlatformChatModelOption[] }> {
  return apiClient<{ models: PlatformChatModelOption[] }>('/ai/platform-chat/models');
}

export function sendPlatformChat(
  messages: ChatMessage[],
  model?: string,
): Promise<{ reply: string; model: string }> {
  return apiClient<{ reply: string; model: string }>('/ai/platform-chat', {
    method: 'POST',
    body: JSON.stringify({ messages, model }),
  });
}
