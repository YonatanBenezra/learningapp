import type { Metadata } from 'next';
import { Navbar } from '@/src/components/marketing/Navbar';
import { Footer } from '@/src/components/marketing/Footer';
import { ContactPageContent } from '@/src/components/marketing/ContactPageContent';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';

export const metadata: Metadata = {
  title: 'Contact Us | LabPath',
  description:
    'Get in touch with the LabPath team for support, billing questions, partnerships, and general enquiries.',
};

export default function ContactPage() {
  return (
    <MarketingPageShell>
      <Navbar />
      <main id="main-content">
        <ContactPageContent />
      </main>
      <Footer />
    </MarketingPageShell>
  );
}
