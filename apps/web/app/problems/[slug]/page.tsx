import { PlatformShell } from '@/src/features/platform';
import { ProblemSolvePage } from '@/src/features/practice/ProblemSolvePage';

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PlatformShell showFooter={false}>
      <ProblemSolvePage slug={slug} />
    </PlatformShell>
  );
}
