import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";

export default async function ExerciseWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <WorkspaceShell slug={slug} />;
}
