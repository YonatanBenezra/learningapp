import * as React from 'react';
import { cn } from '@/src/lib/utils';

export function Skeleton({
  className,
  shimmer = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { shimmer?: boolean }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-line',
        shimmer
          ? 'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent dark:before:via-white/10'
          : 'animate-pulse',
        className,
      )}
      {...props}
    />
  );
}
