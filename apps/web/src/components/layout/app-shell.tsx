type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="ag-page lp-app">
      <div className="lp-main lp-app-main">{children}</div>
    </div>
  );
}
