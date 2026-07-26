'use client';

import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { I18nProvider } from '@/src/i18n';
import { AuthSessionBootstrap, AuthSessionSync } from '@/src/features/auth/useMe';

// Composes all client-side providers. Rendered once in the root layout.
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryProvider>
          <AuthSessionBootstrap />
          <AuthSessionSync />
          {children}
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
