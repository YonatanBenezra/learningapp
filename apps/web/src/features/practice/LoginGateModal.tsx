'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { PRACTICE_PATH } from '@/src/config/mvp';
import { usePathname } from 'next/navigation';
import { Button, buttonClasses } from '@/src/components/ui/button';

export function LoginGateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  if (!open) return null;

  const redirect = encodeURIComponent(
    pathname.startsWith('/problems') ? pathname : PRACTICE_PATH,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-gate-title"
        className="relative w-full max-w-md rounded-2xl border border-line-2 bg-bg p-6 shadow-card"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-ink-2 hover:bg-bg-lav hover:text-ink"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h2 id="login-gate-title" className="text-xl font-semibold text-ink">
          Sign in to continue practicing
        </h2>
        <p className="mt-2 text-sm text-ink-2">
          You&apos;ve completed your free preview. Log in to keep your progress and unlock more
          problems.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/login?redirect=${redirect}`}
            className={buttonClasses({ variant: 'primary', size: 'md', className: 'flex-1' })}
          >
            Log in
          </Link>
          <Link
            href={`/signup?redirect=${redirect}`}
            className={buttonClasses({ variant: 'soft', size: 'md', className: 'flex-1' })}
          >
            Sign up
          </Link>
        </div>
        <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={onClose}>
          Not now
        </Button>
      </div>
    </div>
  );
}
