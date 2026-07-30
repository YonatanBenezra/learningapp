import { Navbar } from '@/src/components/marketing/Navbar';
import { CoursesCatalogSkeleton } from '@/src/components/feedback/CoursesCatalogSkeleton';

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg font-sans text-ink">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col">
        <CoursesCatalogSkeleton />
      </main>
    </div>
  );
}
