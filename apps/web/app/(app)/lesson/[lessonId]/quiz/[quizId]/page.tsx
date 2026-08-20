import { QuizRunner } from '@/src/features/assessments';

export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string; quizId: string }>;
}) {
  const { lessonId, quizId } = await params;
  return <QuizRunner quizId={quizId} lessonId={lessonId} />;
}
