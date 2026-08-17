import { Navbar } from '@/src/components/marketing/Navbar';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';

export function AssessmentSiteShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketingPageShell>
      <Navbar />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </MarketingPageShell>
  );
}
