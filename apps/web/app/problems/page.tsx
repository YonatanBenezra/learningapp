import { Suspense } from 'react';
import { Spinner } from '@/src/components/ui/spinner';
import { ProblemsHomePage } from '@/src/features/platform';

export default function ProblemsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }
    >
      <ProblemsHomePage />
    </Suspense>
  );
}
