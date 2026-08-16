import { APP_NAME_MARK, APP_NAME_REST } from '@/src/lib/brand';
import { cn } from '@/src/lib/utils';

const sizes = {
  sm: 'text-lg font-semibold',
  md: 'text-xl font-bold',
  lg: 'text-2xl font-bold',
  xl: 'text-[28px] font-bold sm:text-[34px]',
} as const;

const markSizes = {
  sm: 'size-8 text-[11px]',
  md: 'size-8 text-[11px] sm:size-9 sm:text-xs',
} as const;

export function LabPathMark({
  size = 'md',
  className,
}: {
  size?: keyof typeof markSizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-lg bg-primary font-bold tracking-tight text-primary-ink',
        markSizes[size],
        className,
      )}
      aria-hidden="true"
    >
      LP
    </span>
  );
}

export function BrandWordmark({
  size = 'md',
  className,
  restClassName,
}: {
  size?: keyof typeof sizes;
  className?: string;
  restClassName?: string;
}) {
  return (
    <span className={cn('tracking-tight text-ink', sizes[size], className)}>
      <span className="text-primary">{APP_NAME_MARK}</span>
      <span className={restClassName}>{APP_NAME_REST}</span>
    </span>
  );
}
