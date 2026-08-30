import Link from "next/link";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { AppNav } from "./app-nav";

export function AppHeader() {
  return (
    <header className="lp-header">
      <div className="lp-header-inner">
        <Link href={routes.home} className="lp-brand-lockup">
          <span className="lp-mark" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
              <path
                d="M5 6.5h6.2L7.8 13.5H14"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="lp-brand">
            <span className="lp-brand-name">{brand.name}</span>
            <span className="lp-brand-byline">{brand.endorsement}</span>
          </span>
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
