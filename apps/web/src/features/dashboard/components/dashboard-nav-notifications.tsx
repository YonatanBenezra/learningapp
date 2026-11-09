"use client";

import { Bell } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { platformUpdates } from "@/features/dashboard/data/platform-updates";
import { DashboardNotificationsPanel } from "./dashboard-notifications-panel";

export function DashboardNavNotifications() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, right: 16 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
      if (target instanceof Element && target.closest(".lp-dash-updates-panel")) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("lp-dash-htb-nav-notify-wrap", open && "is-open")}>
      <button
        ref={triggerRef}
        type="button"
        className={cn("lp-dash-htb-nav-icon-btn lp-dash-htb-nav-notify-btn", open && "is-active")}
        aria-label="Latest updates"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <Bell className="lp-dash-htb-nav-action-icon" strokeWidth={2} aria-hidden />
        {platformUpdates.length > 0 ? (
          <span className="lp-dash-htb-nav-notify-dot" aria-hidden />
        ) : null}
      </button>

      {mounted ? (
        <DashboardNotificationsPanel
          open={open}
          anchor={anchor}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
