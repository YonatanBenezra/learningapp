import { getAiClient } from './ai.client';
import { resolvePlatformChatModel } from './platformChat.models';
import { PLATFORM_ASSISTANT_SYSTEM } from './prompts/platformChat.prompts';
import type { PlatformChatInput } from './platformChat.validation';

function formatTranscript(messages: PlatformChatInput['messages']): string {
  return messages
    .map((m) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
}

export async function replyToPlatformChat(
  messages: PlatformChatInput['messages'],
  model?: string,
) {
  const resolved = resolvePlatformChatModel(model);
  const transcript = formatTranscript(messages);
  const result = await getAiClient().complete({
    system: PLATFORM_ASSISTANT_SYSTEM,
    prompt: `${transcript}\n\nReply to the visitor's latest message. Stay on-topic about the LabPath platform. Be concise unless they ask for detail.`,
    useCase: 'platform-chat',
    model: resolved,
    maxTokens: 700,
  });

  return { reply: result.text.trim(), model: resolved };
}
