'use client';

import { usePathname } from 'next/navigation';
import { getRouteLoadingMessage } from '@/src/features/auth/authLoadingMessages';
import { useAuthLoadingMessage } from '@/src/features/auth/useAuthLoadingMessage';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useAuthStore } from '@/src/store/authStore';
import { PageLoader } from '@/src/components/ui/page-loader';

export function DynamicPageLoader({
  minHeight,
  className,
}: {
  minHeight?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const hydrated = useAuthHydrated();
  const authMessage = useAuthLoadingMessage();
  const bootstrapPhase = useAuthStore((state) => state.bootstrapPhase);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const showAuthMessage = !hydrated || (isAuthenticated && bootstrapPhase === 'loading-profile');
  const message = showAuthMessage ? authMessage : getRouteLoadingMessage(pathname);

  return <PageLoader label={message.label} description={message.description} minHeight={minHeight} className={className} />;
}
