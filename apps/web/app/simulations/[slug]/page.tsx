import { PlatformShell } from '@/src/features/platform';
import { SimulationPage } from '@/src/features/simulations';

export default async function SimulationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PlatformShell showFooter={false}>
      <SimulationPage slug={slug} />
    </PlatformShell>
  );
}
