import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Navbar } from '@/src/components/marketing/Navbar';
import { CoursesCatalogPage } from '@/src/components/marketing/CoursesCatalogPage';
import { CoursesCatalogSkeleton } from '@/src/components/feedback/CoursesCatalogSkeleton';

export const metadata: Metadata = {
  title: 'Courses | AIStudy',
  description:
    'Browse the AIStudy course catalog across programming, cyber security, networking, data science, and more.',
};

export default function CoursesPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg font-sans text-ink">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<CoursesCatalogSkeleton />}>
          <CoursesCatalogPage />
        </Suspense>
      </main>
    </div>
  );
}
