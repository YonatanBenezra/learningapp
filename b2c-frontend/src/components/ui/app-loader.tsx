'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const RING_SIZES = {
  sm: 'size-8',
  md: 'size-14',
  lg: 'size-20',
  xl: 'size-24',
} as const;

const ICON_SIZES = {
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-5',
  xl: 'size-6',
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
      <div className={cn('relative', RING_SIZES[size])} role="status" aria-label={label ?? 'Loading'}>
        <span className="absolute -inset-3 rounded-full bg-primary/10 blur-xl animate-pulse-soft" />
        <span className="absolute inset-0 rounded-full border-2 border-primary/15" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-app-loader-spin" />
        <span className="absolute inset-[18%] rounded-full border-2 border-transparent border-b-primary-2 animate-app-loader-spin-reverse" />
        <span className="absolute inset-0 flex items-center justify-center">
          <Sparkles className={cn('text-primary animate-pulse-soft', ICON_SIZES[size])} />
        </span>
      </div>
      {label ? (
        <div className="max-w-xs space-y-1">
          <p className="text-sm font-semibold text-ink">{label}</p>
          {description ? <p className="text-xs leading-5 text-ink-2">{description}</p> : null}
        </div>
      ) : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center px-4 py-16 animate-fade-in">
        {loader}
      </div>
    );
  }

  return loader;
}
