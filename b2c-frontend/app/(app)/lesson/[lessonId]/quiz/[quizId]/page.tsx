export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string; quizId: string }>;
}) {
  const { lessonId, quizId } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Quiz</h1>
      <p className="text-sm text-zinc-500">
        lesson: {lessonId} · quiz: {quizId}
      </p>
      {/* TODO: implement */}
    </main>
  );
}
