'use client';

import { usePathname } from 'next/navigation';
import { PlatformChatBubble } from '@/src/components/marketing/PlatformChatBubble';

const MARKETING_CHAT_PATHS = new Set(['/', '/courses', '/assessments', '/pricing', '/contact']);

export function PlatformChatBubbleGate() {
  const pathname = usePathname();
  if (!pathname || !MARKETING_CHAT_PATHS.has(pathname)) return null;
  return <PlatformChatBubble />;
}
