'use client';

import { AppShell } from './AppShell';
import { SidebarProvider } from './Sidebar';
import { RoleHomeRedirect } from '@/src/features/auth/RoleHomeRedirect';

export function AuthenticatedAppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <RoleHomeRedirect />
      <AppShell>{children}</AppShell>
    </SidebarProvider>
  );
}
