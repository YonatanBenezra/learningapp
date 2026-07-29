import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Navbar } from '@/src/components/marketing/Navbar';
import { Footer } from '@/src/components/marketing/Footer';
import { CoursesCatalogPage } from '@/src/components/marketing/CoursesCatalogPage';

export const metadata: Metadata = {
  title: 'Courses | AIStudy',
  description:
    'Browse courses from expert instructors across programming, design, marketing, and more.',
};

export default function CoursesPage() {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-bg font-sans text-ink">
      <div>
        <Navbar />
      </div>
      <main className="flex min-h-0 flex-col">
        <Suspense fallback={<div className="min-h-full flex-1 bg-bg" />}>
          <CoursesCatalogPage />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
