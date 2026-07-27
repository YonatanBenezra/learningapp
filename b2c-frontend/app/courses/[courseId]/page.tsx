import type { Metadata } from 'next';
import { CourseDetailPage } from '@/src/features/marketplace/CourseDetailPage';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Course | AIStudy',
    description: 'Explore course details, curriculum, and enrollment options.',
  };
}

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseDetailPage courseId={courseId} />;
}
