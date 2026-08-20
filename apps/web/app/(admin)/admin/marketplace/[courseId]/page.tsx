import { AdminMarketplaceCourseDetailPage } from '@/src/features/admin';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <AdminMarketplaceCourseDetailPage courseId={courseId} />;
}
