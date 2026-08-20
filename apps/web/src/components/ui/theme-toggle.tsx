'use client';

import type { ButtonHTMLAttributes } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/src/providers';
import { cn } from '@/src/lib/utils';

export function ThemeToggle({
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        toggle();
        onClick?.(event);
      }}
      aria-label={props['aria-label'] ?? 'Toggle theme'}
      className={cn(
        'inline-grid size-10 place-items-center rounded-xl border border-line-2 text-ink-2 transition hover:border-primary hover:text-primary',
        className,
      )}
    >
      {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
