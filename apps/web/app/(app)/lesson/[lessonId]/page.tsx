import { LessonView } from '@/src/features/lessons/components/LessonView';

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <LessonView lessonId={lessonId} />;
}
