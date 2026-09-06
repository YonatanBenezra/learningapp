"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";

const dashboardLinks = [
  { href: routes.account, label: "Profile" },
  { href: routes.progress, label: "Progress" },
  { href: routes.billing, label: "Billing" },
];

type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        className={`lp-dash-backdrop${open ? " is-open" : ""}`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside className={`lp-dash-sidebar${open ? " is-open" : ""}`} aria-label="Dashboard">
        <div className="lp-dash-brand">
          <Link href={routes.progress} className="lp-dash-brand-link" onClick={onClose}>
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
            <span>
              <span className="lp-dash-brand-name">{brand.name}</span>
              <span className="lp-dash-brand-byline">Dashboard</span>
            </span>
          </Link>
        </div>

        <nav className="lp-dash-nav">
          <div className="lp-dash-group">
            <p className="lp-dash-group-title">Account</p>
            <ul className="lp-dash-list">
              {dashboardLinks.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`lp-dash-link${active ? " is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      onClick={onClose}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="lp-dash-sidebar-foot">
          <Link href={routes.catalogue} className="lp-dash-foot-link" onClick={onClose}>
            Back to catalogue
          </Link>
        </div>
      </aside>
    </>
  );
}
