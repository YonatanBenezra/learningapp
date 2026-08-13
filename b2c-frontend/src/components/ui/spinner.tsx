import { cn } from '@/src/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'relative inline-block size-4',
        className,
      )}
    >
      <span className="absolute inset-0 rounded-full border-4 border-primary/15" />
      <span className="absolute inset-0 animate-app-loader-spin rounded-full border-4 border-transparent border-t-primary" />
    </span>
  );
}
