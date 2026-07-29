'use client';

import Link from 'next/link';
import { Footer } from '@/src/components/marketing/Footer';
import { Navbar } from '@/src/components/marketing/Navbar';
import { Button } from '@/src/components/ui/button';
import { marketplaceCatalogPath } from '@/src/features/auth/learnerRoutes';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import {
  MarketplaceCourseDetailPage,
  MarketplaceCourseDetailSkeleton,
} from '@/src/features/marketplace/MarketplaceCourseDetailPage';
import { useMarketplaceCourse } from '@/src/features/marketplace';
import { ApiError } from '@/src/infrastructure/apiClient';

function CourseDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-bg font-sans text-ink">
      <div>
        <Navbar />
      </div>
      <main className="min-h-0">{children}</main>
      <Footer />
    </div>
  );
}

export function CourseDetailPage({ courseId }: { courseId: string }) {
  const hydrated = useAuthHydrated();
  const marketplaceQ = useMarketplaceCourse(courseId, { enabled: hydrated });

  if (!hydrated || marketplaceQ.isLoading) {
    return (
      <CourseDetailLayout>
        <MarketplaceCourseDetailSkeleton />
      </CourseDetailLayout>
    );
  }

  if (marketplaceQ.data) {
    return (
      <CourseDetailLayout>
        <MarketplaceCourseDetailPage data={marketplaceQ.data} />
      </CourseDetailLayout>
    );
  }

  if (
    marketplaceQ.isError &&
    (!(marketplaceQ.error instanceof ApiError) || marketplaceQ.error.status !== 404)
  ) {
    return (
      <CourseDetailLayout>
        <div className="px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-ink">Could not load course</h1>
          <p className="mt-2 text-sm text-ink-2">Please try again in a moment.</p>
        </div>
      </CourseDetailLayout>
    );
  }

  return (
    <CourseDetailLayout>
      <div className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-ink">Course not found</h1>
        <p className="mt-2 text-sm text-ink-2">
          This course may be unavailable or you may not have access yet.
        </p>
        <Link href={marketplaceCatalogPath()} className="mt-6 inline-block">
          <Button variant="soft">Browse courses</Button>
        </Link>
      </div>
    </CourseDetailLayout>
  );
}
