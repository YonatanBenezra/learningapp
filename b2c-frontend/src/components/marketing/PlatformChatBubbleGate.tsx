'use client';

import { usePathname } from 'next/navigation';
import { PlatformChatBubble } from '@/src/components/marketing/PlatformChatBubble';
import { MARKETING_TOUR_PATHS } from '@/src/features/marketing-tour/constants';

export function PlatformChatBubbleGate() {
  const pathname = usePathname();
  if (!pathname || !MARKETING_TOUR_PATHS.has(pathname)) return null;
  return <PlatformChatBubble />;
}
