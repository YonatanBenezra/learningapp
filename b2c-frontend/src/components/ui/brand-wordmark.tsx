import { APP_NAME_MARK, APP_NAME_REST } from '@/src/lib/brand';
import { cn } from '@/src/lib/utils';

const sizes = {
  sm: 'text-lg font-semibold',
  md: 'text-xl font-bold',
  lg: 'text-2xl font-bold',
  xl: 'text-[28px] font-bold sm:text-[34px]',
} as const;

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
