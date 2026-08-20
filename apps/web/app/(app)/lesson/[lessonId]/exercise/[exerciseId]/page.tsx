import ExercisePageClient from './ExercisePageClient';

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ lessonId: string; exerciseId: string }>;
}) {
  const { lessonId, exerciseId } = await params;
  return <ExercisePageClient lessonId={lessonId} exerciseId={exerciseId} />;
}
