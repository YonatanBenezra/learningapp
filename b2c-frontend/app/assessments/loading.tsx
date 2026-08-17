import { AssessmentSiteShell } from '@/src/components/marketing/AssessmentSiteShell';
import { AssessmentsListSkeleton } from '@/src/features/skill-assessment/SkillAssessmentSkeletons';

export default function Loading() {
  return (
    <AssessmentSiteShell>
      <AssessmentsListSkeleton />
    </AssessmentSiteShell>
  );
}
