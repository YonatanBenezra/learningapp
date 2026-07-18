import * as React from 'react';
import { cn } from '@/src/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-xl border border-line-2 bg-bg px-3.5 text-sm text-ink outline-none transition',
          'placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/20',
          'disabled:opacity-50 disabled:pointer-events-none',
          className,
        )}
        {...props}
      />
    );
  },
);
