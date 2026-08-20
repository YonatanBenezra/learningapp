import { Navbar } from '@/src/components/marketing/Navbar';
import { CoursesCatalogSkeleton } from '@/src/components/feedback/CoursesCatalogSkeleton';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';

export default function Loading() {
  return (
    <MarketingPageShell>
      <Navbar />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        <CoursesCatalogSkeleton />
      </main>
    </MarketingPageShell>
  );
}
