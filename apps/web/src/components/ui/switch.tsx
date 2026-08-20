'use client';

import { cn } from '@/src/lib/utils';

export function Switch({
  checked,
  onChange,
  id,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-line-2',
        className,
      )}
    >
      <span
        className={cn(
          'block size-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
