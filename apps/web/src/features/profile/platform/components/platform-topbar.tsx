"use client";

import {
  CircleHelp,
  Grid3X3,
  Home,
  Megaphone,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/config/routes";
import { authUserInitials } from "@/features/auth/use-auth-session";
import { HexLogo } from "@/features/profile/platform/components/hex-logo";
import { cn } from "@/lib/utils";
import type { User as AppUser } from "@/types/user";

type PlatformTopbarProps = {
  user: AppUser;
};

const navBtn =
  "inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-semibold text-platform-muted transition-colors duration-150 hover:bg-platform-input hover:text-platform-text";

export function PlatformTopbar({ user }: PlatformTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = authUserInitials(user);

  return (
    <header className="sticky top-0 z-50 h-[var(--height-platform-topbar)] border-b border-platform-border bg-platform-page/95 backdrop-blur-md">
      <div className="mx-auto flex h-full w-[var(--lp-catalog-content-width)] max-w-[1320px] items-center gap-4 px-0">
        <Link href={routes.home} className="shrink-0">
          <HexLogo />
        </Link>

        <nav className="flex flex-1 items-center gap-1" aria-label="Primary">
          <Link href={routes.dashboard} className={navBtn}>
            <Home className="size-4" strokeWidth={2} aria-hidden />
            Home
          </Link>
          <Link
            href={routes.account}
            className={cn(navBtn, "border-b-2 border-platform-accent text-platform-text")}
            aria-current="page"
          >
            <User className="size-4" strokeWidth={2} aria-hidden />
            Profile
          </Link>
          <Link href={`${routes.account}#profile-settings`} className={navBtn}>
            <Settings className="size-4" strokeWidth={2} aria-hidden />
            Settings
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className={cn(navBtn, "px-2.5")} aria-label="Latest updates">
            <Megaphone className="size-[18px]" strokeWidth={2} />
          </button>
          <button type="button" className={cn(navBtn, "px-2.5 max-md:hidden")} aria-label="Help">
            <CircleHelp className="size-[18px]" strokeWidth={2} />
          </button>
          <button type="button" className={cn(navBtn, "px-2.5 max-lg:hidden")} aria-label="Apps">
            <Grid3X3 className="size-[18px]" strokeWidth={2} />
          </button>
          <div className="relative ml-1">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded border border-platform-accent/60 bg-platform-card text-xs font-bold text-platform-accent transition-colors duration-150 hover:bg-platform-input"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {initials}
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 min-w-[160px] rounded border border-platform-border bg-platform-card py-1 shadow-lg"
              >
                <Link
                  role="menuitem"
                  href={routes.dashboard}
                  className="block px-3 py-2 text-sm text-platform-text hover:bg-platform-input"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  role="menuitem"
                  href={routes.problems}
                  className="block px-3 py-2 text-sm text-platform-text hover:bg-platform-input"
                  onClick={() => setMenuOpen(false)}
                >
                  Problems
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
