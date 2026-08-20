import { Container } from '@/src/components/marketing/Container';
import { Skeleton } from '@/src/components/ui/skeleton';

export function CoursesCatalogSkeleton() {
  return (
    <section className="bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
      <Container>
        <Skeleton className="h-10 w-full max-w-md" shimmer />
        <Skeleton className="mt-3 h-5 w-full max-w-xl" shimmer />

        <div className="mt-8 flex gap-6 border-b border-line/70 pb-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-5 w-20" shimmer />
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Skeleton className="h-11 w-72 rounded-md" shimmer />
          <Skeleton className="h-11 w-44 rounded-md" shimmer />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-md border border-line/80 bg-bg-elev/90 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-md" shimmer />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28" shimmer />
                  <Skeleton className="mt-2 h-3 w-16" shimmer />
                </div>
              </div>
              <Skeleton className="mt-5 h-6 w-4/5" shimmer />
              <Skeleton className="mt-6 h-3 w-20" shimmer />
              <Skeleton className="mt-1.5 h-2 w-full rounded-full" shimmer />
              <Skeleton className="mt-4 h-11 w-full rounded-md" shimmer />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
