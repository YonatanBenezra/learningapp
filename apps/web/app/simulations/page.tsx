import { Suspense } from 'react';
import { Spinner } from '@/src/components/ui/spinner';
import { PlatformShell } from '@/src/features/platform';
import { SimulationsHome } from '@/src/features/simulations';

export default function SimulationsListPage() {
  return (
    <PlatformShell showFooter={false}>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        }
      >
        <SimulationsHome />
      </Suspense>
    </PlatformShell>
  );
}
