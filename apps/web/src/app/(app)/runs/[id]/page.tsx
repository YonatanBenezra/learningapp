import { PagePlaceholder } from "@/components/ui/page-placeholder";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PagePlaceholder title={`Run ${id}`} />;
}
