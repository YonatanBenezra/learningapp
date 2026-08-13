'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const RING_SIZES = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
  xl: 'size-20',
} as const;

const BORDER_WIDTH = {
  sm: 'border-[3px]',
  md: 'border-4',
  lg: 'border-[5px]',
  xl: 'border-[6px]',
} as const;

const ICON_SIZES = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-4',
  xl: 'size-5',
} as const;

export type AppLoaderSize = keyof typeof RING_SIZES;

export function AppLoader({
  size = 'md',
  label,
  description,
  className,
  fullScreen = false,
}: {
  size?: AppLoaderSize;
  label?: string;
  description?: string;
  className?: string;
  fullScreen?: boolean;
}) {
  const loader = (
    <div className={cn('flex flex-col items-center gap-4 text-center', className)}>
      <div
        className={cn('relative grid place-items-center', RING_SIZES[size])}
        role="status"
        aria-label={label ?? 'Loading'}
      >
        <span
          className={cn(
            'absolute inset-0 rounded-full border-primary/15',
            BORDER_WIDTH[size],
          )}
        />
        <span
          className={cn(
            'absolute inset-0 rounded-full border-transparent border-t-primary animate-app-loader-spin',
            BORDER_WIDTH[size],
          )}
        />
        <Sparkles className={cn('relative text-primary', ICON_SIZES[size])} aria-hidden="true" />
      </div>
      {label ? (
        <div className="max-w-sm space-y-1.5" aria-live="polite">
          <p className="text-base font-semibold text-ink sm:text-lg">{label}</p>
          {description ? (
            <p className="text-sm leading-6 text-ink-2">{description}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center px-4 py-16">
        {loader}
      </div>
    );
  }

  return loader;
}
