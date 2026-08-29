import Link from "next/link";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AppNav } from "./app-nav";

export function AppHeader() {
  return (
    <header className="lp-header">
      <div className="lp-header-inner">
        <Link href={routes.home} className="lp-brand">
          <span className="lp-brand-name">{brand.name}</span>
          <span className="lp-brand-byline">{brand.endorsement}</span>
        </Link>
        <div className="lp-header-actions">
          <AppNav />
          <Link href={routes.login} className="lp-btn lp-btn-ghost">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
