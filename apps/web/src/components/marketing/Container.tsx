import { cn } from '@/src/lib/utils';

// Shared page container — one max-width for the whole marketing site.
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
