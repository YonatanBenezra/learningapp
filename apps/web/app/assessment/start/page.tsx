import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Spinner } from '@/src/components/ui/spinner';
import { StartAssessmentPage } from '@/src/features/skill-assessment/CreateAssessmentFlow';

export const metadata: Metadata = {
  title: 'Start assessment | LabPath',
  description: 'Complete a quick 12-question skill check to unlock AI engineering practice.',
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }
    >
      <StartAssessmentPage />
    </Suspense>
  );
}
