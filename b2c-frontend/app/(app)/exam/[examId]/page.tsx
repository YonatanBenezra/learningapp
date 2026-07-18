export default async function Page({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Exam</h1>
      <p className="text-sm text-zinc-500">examId: {examId}</p>
      {/* TODO: implement */}
    </main>
  );
}
