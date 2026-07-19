import { Navbar } from '@/src/components/marketing/Navbar';
import { Hero } from '@/src/components/marketing/Hero';
import { Categories } from '@/src/components/marketing/Categories';
import {
  WhySection,
  FeaturesSection,
  LabBand,
  StatsSection,
  ProcessSection,
  DomainsSection,
  CtaSection,
} from '@/src/components/marketing/Sections';
import { Pricing } from '@/src/components/marketing/Pricing';
import { Faq } from '@/src/components/marketing/Faq';
import { Footer } from '@/src/components/marketing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <WhySection />
        <FeaturesSection />
        <LabBand />
        <StatsSection />
        <ProcessSection />
        <DomainsSection />
        <Pricing />
        <Faq />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
