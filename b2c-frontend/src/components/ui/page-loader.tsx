import { AppLoader } from '@/src/components/ui/app-loader';
import { cn } from '@/src/lib/utils';

export function PageLoader({
  label = 'Loading…',
  description,
  className,
  minHeight = '60vh',
}: {
  label?: string;
  description?: string;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={cn('flex flex-1 items-center justify-center bg-bg px-4 py-16 animate-fade-in', className)}
      style={{ minHeight }}
    >
      <AppLoader size="lg" label={label} description={description} />
    </div>
  );
}
