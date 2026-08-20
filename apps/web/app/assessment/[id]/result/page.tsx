import { Suspense } from 'react';
import { Spinner } from '@/src/components/ui/spinner';
import SkillAssessmentResultClient from './SkillAssessmentResultClient';

export default async function SkillAssessmentResultPage({
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
      <SkillAssessmentResultClient id={id} />
    </Suspense>
  );
}
