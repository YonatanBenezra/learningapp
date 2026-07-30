import { AssessmentSiteShell } from '@/src/components/marketing/AssessmentSiteShell';
import { PageLoader } from '@/src/components/ui/page-loader';

export default function Loading() {
  return (
    <AssessmentSiteShell>
      <PageLoader label="Loading assessments" description="Preparing skill checks and practice paths…" />
    </AssessmentSiteShell>
  );
}
