import CourseFlowGraph from '@/src/features/courses/components/CourseFlowGraph';

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  // Course->Module->Lesson node graph (@xyflow/react). Doubles as navigation. See §1.4, §5.
  return (
    <main className="h-[calc(100vh-4rem)] w-full">
      <CourseFlowGraph courseId={courseId} />
    </main>
  );
}
