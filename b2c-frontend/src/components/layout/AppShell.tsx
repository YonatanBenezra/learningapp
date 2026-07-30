'use client';

import { Sidebar, useSidebar } from './Sidebar';
import { AdminTopbar } from './AdminTopbar';
import { PageTransition } from '@/src/components/feedback/PageTransition';
import { cn } from '@/src/lib/utils';

// Lives inside <SidebarProvider>, so it can read `collapsed` and shift the main
// column in lockstep with the desktop rail.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]',
        )}
      >
        <AdminTopbar />
        <main className="flex-1 overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
