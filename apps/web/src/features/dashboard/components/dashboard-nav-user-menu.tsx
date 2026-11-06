"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { routes } from "@/config/routes";
import { LogoutButton } from "@/features/auth/logout-button";
import { authUserInitials } from "@/features/auth/use-auth-session";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

const E = [0.2, 0, 0, 1] as const;

function userDisplayName(user: User) {
  return user.displayName?.trim() || user.email.split("@")[0] || "Account";
}

function NavInitialsAvatar({
  initials,
  active,
  className,
}: {
  initials: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("lp-dash-htb-nav-avatar", active && "is-active", className)}
      aria-hidden
    >
      {initials}
    </span>
  );
}

type MenuAnchor = {
  top: number;
  right: number;
};

export function DashboardNavUserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<MenuAnchor>({ top: 0, right: 16 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const name = userDisplayName(user);
  const initials = authUserInitials(user);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateAnchor = () => {
    const node = triggerRef.current;
    if (!node) {
      return;
    }
    const rect = node.getBoundingClientRect();
    setAnchor({
      top: rect.bottom + 10,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (target instanceof Element && target.closest(".lp-dash-htb-nav-user-menu")) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menu =
    mounted && open ? (
      <AnimatePresence>
        <motion.div
          role="menu"
          className="lp-dash-htb-nav-user-menu lp-dash-htb-nav-user-menu--portal"
          style={{ top: anchor.top, right: anchor.right }}
          aria-label={`Signed in as ${name}`}
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: E }}
        >
          <div className="lp-dash-htb-nav-user-menu-head">
            <NavInitialsAvatar initials={initials} className="lp-dash-htb-nav-avatar--menu" />
            <div className="lp-dash-htb-nav-user-menu-meta">
              <p className="lp-dash-htb-nav-user-menu-name" title={name}>
                {name}
              </p>
              <p className="lp-dash-htb-nav-user-menu-email" title={user.email}>
                {user.email}
              </p>
            </div>
          </div>

          <div className="lp-dash-htb-nav-user-menu-actions">
            <LogoutButton
              label="Logout"
              pendingLabel="Logging out…"
              className="lp-dash-htb-nav-user-menu-logout"
              onDone={() => setOpen(false)}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    ) : null;

  return (
    <div
      className={cn("lp-dash-htb-nav-user", open && "is-open")}
      ref={rootRef}
    >
      <button
        ref={triggerRef}
        type="button"
        className="lp-dash-htb-nav-avatar-btn"
        aria-label={`Account menu, ${name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <NavInitialsAvatar initials={initials} active={open} />
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

export function DashboardNavUserMenuSlot({ user }: { user: User | null }) {
  if (user) {
    return <DashboardNavUserMenu user={user} />;
  }
  return (
    <Link href={routes.signIn} className="lp-dash-htb-nav-avatar-btn" aria-label="Sign in">
      <NavInitialsAvatar initials="?" />
    </Link>
  );
}
