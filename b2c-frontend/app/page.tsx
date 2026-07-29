import { Suspense } from 'react';
import { Navbar } from '@/src/components/marketing/Navbar';
import { Hero } from '@/src/components/marketing/Hero';
import { Categories } from '@/src/components/marketing/Categories';
import { Footer } from '@/src/components/marketing/Footer';
import { LandingAssessmentPrompt } from '@/src/components/marketing/LandingAssessmentPrompt';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';

export default function LandingPage() {
  return (
    <MarketingPageShell>
      <Suspense fallback={null}>
        <LandingAssessmentPrompt />
      </Suspense>
      <Navbar />
      <main>
        <Hero />
        <Categories />
      </main>
      <Footer />
    </MarketingPageShell>
  );
}
