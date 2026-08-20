import { PlatformShell } from '@/src/features/platform';
import { AssessmentsListSkeleton } from '@/src/features/skill-assessment/SkillAssessmentSkeletons';

export default function Loading() {
  return (
    <PlatformShell showFooter={false}>
      <AssessmentsListSkeleton />
    </PlatformShell>
  );
}
