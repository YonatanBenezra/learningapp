import { Suspense } from 'react';
import SkillAssessmentClient from './SkillAssessmentClient';
import { Spinner } from '@/src/components/ui/spinner';

export default async function SkillAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }
    >
      <SkillAssessmentClient id={id} />
    </Suspense>
  );
}
