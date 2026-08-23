import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spinner } from '@/src/components/ui/spinner';
import { PlatformShell } from '@/src/features/platform';
import { GuidedCourseOverview } from '@/src/features/courses/components/GuidedCourseOverview';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Guided Course | LabPath',
    description: 'Structured learning with readings, simulations, and knowledge checks.',
  };
}

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  return (
    <PlatformShell showFooter={false}>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        }
      >
        <GuidedCourseOverview courseId={courseId} />
      </Suspense>
    </PlatformShell>
  );
}
