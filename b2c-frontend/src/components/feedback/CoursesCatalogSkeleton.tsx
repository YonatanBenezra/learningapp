import { Container } from '@/src/components/marketing/Container';
import { Skeleton } from '@/src/components/ui/skeleton';

export function CoursesCatalogSkeleton() {
  return (
    <Container className="py-10 lg:py-14">
      <Skeleton className="h-4 w-28" shimmer />
      <Skeleton className="mt-4 h-10 w-full max-w-xl" shimmer />
      <Skeleton className="mt-3 h-5 w-full max-w-lg" shimmer />

      <div className="mt-8 flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-24 rounded-full" shimmer />
        ))}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
            <Skeleton className="h-44 w-full rounded-none" shimmer />
            <div className="space-y-3 p-5">
              <Skeleton className="h-4 w-20 rounded-full" shimmer />
              <Skeleton className="h-6 w-full" shimmer />
              <Skeleton className="h-4 w-4/5" shimmer />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" shimmer />
                <Skeleton className="h-6 w-20 rounded-full" shimmer />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
