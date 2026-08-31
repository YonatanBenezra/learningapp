import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";

export default async function ExerciseWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { slug } = await params;
  const { path } = await searchParams;
  return <WorkspaceShell slug={slug} pathSlug={path} />;
}
