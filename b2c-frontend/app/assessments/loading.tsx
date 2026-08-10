import { AssessmentSiteShell } from '@/src/components/marketing/AssessmentSiteShell';
import { DynamicPageLoader } from '@/src/components/feedback/DynamicPageLoader';

export default function Loading() {
  return (
    <AssessmentSiteShell>
      <DynamicPageLoader />
    </AssessmentSiteShell>
  );
}
