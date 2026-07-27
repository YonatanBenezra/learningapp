'use client';

import { usePathname } from 'next/navigation';
import { PlatformChatBubble } from '@/src/components/marketing/PlatformChatBubble';

const HIDDEN_PATHS = new Set(['/dashboard', '/login', '/signup']);

export function PlatformChatBubbleGate() {
  const pathname = usePathname();
  if (HIDDEN_PATHS.has(pathname)) return null;
  return <PlatformChatBubble />;
}
