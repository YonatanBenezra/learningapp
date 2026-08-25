import { AppHeader } from "./app-header";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
