import { Navbar } from '@/src/components/marketing/Navbar';
import { Footer } from '@/src/components/marketing/Footer';
import { PageLoader } from '@/src/components/ui/page-loader';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';

export default function Loading() {
  return (
    <MarketingPageShell>
      <Navbar />
      <main>
        <PageLoader label="Loading pricing" description="Comparing plans and features…" minHeight="50vh" />
      </main>
      <Footer />
    </MarketingPageShell>
  );
}
