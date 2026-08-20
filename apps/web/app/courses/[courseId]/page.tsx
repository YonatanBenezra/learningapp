import type { Metadata } from 'next';
import { CourseDetailPage } from '@/src/features/marketplace/CourseDetailPage';

function backendBaseUrl(): string {
  return (process.env.BACKEND_URL ?? 'http://localhost:4000').trim().replace(/\/$/, '');
}

async function fetchCourseTitle(courseId: string): Promise<string | null> {
  try {
    const response = await fetch(`${backendBaseUrl()}/marketplace/courses/${courseId}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { course?: { title?: string; description?: string } };
    return data.course?.title ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const title = await fetchCourseTitle(courseId);

  if (title) {
    return {
      title: `${title} | LabPath`,
      description: `Explore ${title} — curriculum, instructor details, and enrollment options.`,
    };
  }

  return {
    title: 'Course | LabPath',
    description: 'Explore course details, curriculum, and enrollment options.',
  };
}

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseDetailPage courseId={courseId} />;
}
