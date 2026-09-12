import { ContestWorkspaceShell } from "@/features/contests/components/contest-workspace-shell";

export default async function ContestProblemPage({
  params,
}: {
  params: Promise<{ slug: string; exerciseSlug: string }>;
}) {
  const { slug, exerciseSlug } = await params;
  return (
    <ContestWorkspaceShell contestSlug={slug} exerciseSlug={exerciseSlug} />
  );
}
