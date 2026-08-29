import { brand } from "@/config/brand";
import { AppHeader } from "./app-header";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="lp-shell">
      <AppHeader />
      <div className="lp-main">{children}</div>
      <footer className="lp-footer">
        {brand.name} · {brand.endorsement}
      </footer>
    </div>
  );
}
