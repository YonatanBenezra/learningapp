import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { Spinner } from './spinner';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  primary: 'bg-primary text-primary-ink shadow-card hover:brightness-110 active:brightness-95',
  soft: 'bg-bg text-ink border border-line-2 shadow-soft hover:border-primary hover:text-primary',
  ghost: 'text-ink-2 hover:text-ink hover:bg-bg-lav',
  outline: 'border border-line-2 text-ink hover:bg-bg-lav',
  danger: 'bg-bad text-white hover:brightness-110',
} as const;

const sizes = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-10 w-10',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

// Shared class builder so links (<Link className={buttonClasses(...)}>) can look
// like buttons without duplicating styles.
export function buttonClasses(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(base, variants[opts.variant ?? 'primary'], sizes[opts.size ?? 'md'], opts.className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
