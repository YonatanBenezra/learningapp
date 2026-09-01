import { ContestWorkspaceShell } from "@/features/contests/components/contest-workspace-shell";

export default function ContestProblemPage({
  params,
}: {
  params: { slug: string; exerciseSlug: string };
}) {
  return (
    <ContestWorkspaceShell
      contestSlug={params.slug}
      exerciseSlug={params.exerciseSlug}
    />
  );
}
