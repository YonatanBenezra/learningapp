import { ContestWorkspaceShell } from "@/features/contests/components/contest-workspace-shell";

export default async function ContestVirtualProblemPage({
  params,
}: {
  params: Promise<{ slug: string; exerciseSlug: string }>;
}) {
  const { slug, exerciseSlug } = await params;
  return (
    <ContestWorkspaceShell
      contestSlug={slug}
      exerciseSlug={exerciseSlug}
      variant="contest"
      workspaceMode="virtual"
    />
  );
}
