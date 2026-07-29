import type { ReactNode } from 'react';

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-bg font-sans text-ink">{children}</div>
  );
}
