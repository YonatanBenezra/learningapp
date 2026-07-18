export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Lesson</h1>
      <p className="text-sm text-zinc-500">lessonId: {lessonId}</p>
      {/* TODO: implement */}
    </main>
  );
}
