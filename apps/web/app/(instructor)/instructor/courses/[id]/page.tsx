import { InstructorCourseDetailPage } from '@/src/features/instructor/InstructorCourseDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InstructorCourseDetailPage courseId={id} />;
}
