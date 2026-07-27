'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Footer } from '@/src/components/marketing/Footer';
import { MarketingPageShell } from '@/src/components/marketing/MarketingPageShell';
import { Navbar } from '@/src/components/marketing/Navbar';
import { Button } from '@/src/components/ui/button';
import { learnerCoursePath, marketplaceCatalogPath } from '@/src/features/auth/learnerRoutes';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useCourse } from '@/src/features/courses';
import {
  MarketplaceCourseDetailPage,
  MarketplaceCourseDetailSkeleton,
} from '@/src/features/marketplace/MarketplaceCourseDetailPage';
import { useMarketplaceCourse } from '@/src/features/marketplace';
import { useAuthStore } from '@/src/store/authStore';
import { ApiError } from '@/src/infrastructure/apiClient';

export function CourseDetailPage({ courseId }: { courseId: string }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const accessQ = useCourse(courseId, { enabled: hydrated && isAuthenticated });
  const hasLearnerAccess = Boolean(accessQ.data?.course);
  const accessCheckDone = !isAuthenticated || accessQ.isFetched;

  useEffect(() => {
    if (hasLearnerAccess) {
      router.replace(learnerCoursePath(courseId));
    }
  }, [hasLearnerAccess, courseId, router]);

  const marketplaceQ = useMarketplaceCourse(courseId, {
    enabled: hydrated && accessCheckDone && !hasLearnerAccess,
  });

  if (!hydrated || (isAuthenticated && accessQ.isLoading) || hasLearnerAccess) {
    return (
      <MarketingPageShell>
        <Navbar />
        <main>
          <MarketplaceCourseDetailSkeleton />
        </main>
        <Footer />
      </MarketingPageShell>
    );
  }

  if (marketplaceQ.isLoading) {
    return (
      <MarketingPageShell>
        <Navbar />
        <main>
          <MarketplaceCourseDetailSkeleton />
        </main>
        <Footer />
      </MarketingPageShell>
    );
  }

  if (marketplaceQ.data) {
    return (
      <MarketingPageShell>
        <Navbar />
        <main>
          <MarketplaceCourseDetailPage data={marketplaceQ.data} />
        </main>
        <Footer />
      </MarketingPageShell>
    );
  }

  if (
    marketplaceQ.isError &&
    (!(marketplaceQ.error instanceof ApiError) || marketplaceQ.error.status !== 404)
  ) {
    return (
      <MarketingPageShell>
        <Navbar />
        <main className="px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-ink">Could not load course</h1>
          <p className="mt-2 text-sm text-ink-2">Please try again in a moment.</p>
        </main>
        <Footer />
      </MarketingPageShell>
    );
  }

  return (
    <MarketingPageShell>
      <Navbar />
      <main className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-ink">Course not found</h1>
        <p className="mt-2 text-sm text-ink-2">
          This course may be unavailable or you may not have access yet.
        </p>
        <Link href={marketplaceCatalogPath()} className="mt-6 inline-block">
          <Button variant="soft">Browse courses</Button>
        </Link>
      </main>
      <Footer />
    </MarketingPageShell>
  );
}
