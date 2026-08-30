import { brand } from "@/config/brand";
import { HomeNav } from "@/features/home/home-nav";
import "@/features/home/home.css";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="ag-page lp-app">
      <HomeNav />
      <div className="lp-main lp-app-main">{children}</div>
      <footer className="lp-app-foot">
        {brand.name} · {brand.endorsement}
      </footer>
    </div>
  );
}
