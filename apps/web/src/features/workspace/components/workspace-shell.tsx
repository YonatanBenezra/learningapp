import { BriefPanel } from "./brief-panel";
import { RunPanel } from "./run-panel";
import { SubmissionSurface } from "./submission-surface";

type WorkspaceShellProps = {
  slug: string;
};

export function WorkspaceShell({ slug }: WorkspaceShellProps) {
  return (
    <div className="grid min-h-[calc(100vh-57px)] grid-cols-[minmax(16rem,22rem)_1fr_minmax(16rem,22rem)]">
      <BriefPanel slug={slug} />
      <SubmissionSurface />
      <RunPanel />
    </div>
  );
}
