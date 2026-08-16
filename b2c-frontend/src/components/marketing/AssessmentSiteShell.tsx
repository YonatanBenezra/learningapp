import { Navbar } from '@/src/components/marketing/Navbar';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';

export function AssessmentSiteShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketingPageShell>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(0,127,142,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,127,142,0.05) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <Navbar />
        <main id="main-content" className="relative">{children}</main>
      </div>
    </MarketingPageShell>
  );
}
