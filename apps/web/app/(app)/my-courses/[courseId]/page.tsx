import type { Metadata } from 'next';
import { CourseOverview } from '@/src/features/courses/components/CourseOverview';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Course | LabPath',
    description: 'Continue learning with modules, lessons, and progress tracking.',
  };
}

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseOverview courseId={courseId} />;
}
