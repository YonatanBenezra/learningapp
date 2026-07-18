export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string; exerciseId: string }>;
}) {
  const { lessonId, exerciseId } = await params;
  // Launches the domain-appropriate lab environment for this exercise. See §1.6.
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Exercise</h1>
      <p className="text-sm text-zinc-500">
        lesson: {lessonId} · exercise: {exerciseId}
      </p>
      {/* TODO: implement */}
    </main>
  );
}
