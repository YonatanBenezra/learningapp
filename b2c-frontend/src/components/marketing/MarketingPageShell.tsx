'use client';

import type { ReactNode } from 'react';
import { PageTransition } from '@/src/components/feedback/PageTransition';

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="flex flex-1 flex-col bg-bg font-sans text-ink">{children}</div>
    </PageTransition>
  );
}
