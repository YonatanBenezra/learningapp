import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Navbar } from '@/src/components/marketing/Navbar';
import { CoursesCatalogPage } from '@/src/components/marketing/CoursesCatalogPage';
import { CoursesCatalogSkeleton } from '@/src/components/feedback/CoursesCatalogSkeleton';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';

export const metadata: Metadata = {
  title: 'Courses | LabPath',
  description:
    'Browse the LabPath course catalog across machine learning, generative AI, data science, and more.',
};

export default function CoursesPage() {
  return (
    <MarketingPageShell>
      <Navbar />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<CoursesCatalogSkeleton />}>
          <CoursesCatalogPage />
        </Suspense>
      </main>
    </MarketingPageShell>
  );
}
