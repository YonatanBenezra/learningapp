export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Course Overview</h1>
      <p className="text-sm text-zinc-500">courseId: {courseId}</p>
      {/* TODO: implement */}
    </main>
  );
}
