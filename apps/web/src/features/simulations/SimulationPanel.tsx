import type { ReactNode } from 'react';

export function SimulationPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e5e5] bg-white dark:border-line-2 dark:bg-bg">
      <div className="border-b border-[#e5e5e5] bg-[#fafafa] px-4 py-2.5 dark:border-line-2 dark:bg-bg-soft">
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-3">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
