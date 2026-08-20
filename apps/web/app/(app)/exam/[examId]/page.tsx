import { ExamRunner } from '@/src/features/assessments';

export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <ExamRunner examId={examId} />;
}
