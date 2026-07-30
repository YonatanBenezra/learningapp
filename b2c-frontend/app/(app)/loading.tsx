import { PageLoader } from '@/src/components/ui/page-loader';

export default function Loading() {
  return (
    <PageLoader
      label="Loading your dashboard"
      description="Fetching courses, progress, and activity…"
    />
  );
}
