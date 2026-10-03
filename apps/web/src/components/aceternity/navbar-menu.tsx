"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type NavMenuItem = {
  href: string;
  label: string;
  active?: boolean;
};

type NavbarMenuProps = {
  items: NavMenuItem[];
  className?: string;
  onNavigate?: () => void;
};

/** Primary app links — segmented SaaS nav pills. */
export function NavbarMenu({ items, className, onNavigate }: NavbarMenuProps) {
  return (
    <nav className={cn("lp-nav-menu", className)} aria-label="Main">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn("lp-nav-menu-link", item.active && "is-active")}
          aria-current={item.active ? "page" : undefined}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
