'use client';

import Link from 'next/link';
import { useAuthStore } from '@/src/store/authStore';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { PRACTICE_PATH } from '@/src/config/mvp';
import { APP_NAME } from '@/src/lib/brand';
import { BrandWordmark, LabPathMark } from '@/src/components/ui/brand-wordmark';
import { buttonClasses } from '@/src/components/ui/button';
import { PracticeSyncBootstrap } from './usePracticeSync';

export function PracticeShell({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);

  return (
    <>
      <PracticeSyncBootstrap />
      <header className="border-b border-line-2 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2" aria-label={`${APP_NAME} home`} title="Back to homepage">
            <LabPathMark size="sm" />
            <BrandWordmark size="sm" className="font-semibold" />
          </Link>
          {hydrated && (
            <nav className="flex items-center gap-2">
              {user ? (
                <span className="hidden text-sm text-ink-2 sm:inline">{user.email}</span>
              ) : (
                <>
                  <Link href={`/login?redirect=${encodeURIComponent(PRACTICE_PATH)}`} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                    Log in
                  </Link>
                  <Link href={`/signup?redirect=${encodeURIComponent(PRACTICE_PATH)}`} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
