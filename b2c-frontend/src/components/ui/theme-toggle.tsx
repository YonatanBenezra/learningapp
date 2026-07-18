'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/src/providers';
import { cn } from '@/src/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        'inline-grid size-10 place-items-center rounded-xl border border-line-2 text-ink-2 transition hover:border-primary hover:text-primary',
        className,
      )}
    >
      {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
