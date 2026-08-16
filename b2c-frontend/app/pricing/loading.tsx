import { Navbar } from '@/src/components/marketing/Navbar';
import { Footer } from '@/src/components/marketing/Footer';
import { DynamicPageLoader } from '@/src/components/feedback/DynamicPageLoader';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';

export default function Loading() {
  return (
    <MarketingPageShell>
      <Navbar />
      <main id="main-content">
        <DynamicPageLoader minHeight="50vh" />
      </main>
      <Footer />
    </MarketingPageShell>
  );
}
