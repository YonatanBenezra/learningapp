'use client';

import { AppLoader } from '@/src/components/ui/app-loader';
import { useAuthLoadingMessage } from './useAuthLoadingMessage';

export function AuthWorkspaceLoader({ redirecting = false }: { redirecting?: boolean }) {
  const message = useAuthLoadingMessage({ redirecting });

  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-bg px-4">
      <AppLoader size="lg" label={message.label} description={message.description} />
    </div>
  );
}
